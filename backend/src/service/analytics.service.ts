import sessionService from '../service/session.service';
import sessionPartService from './sessionPart.service';
import activityService from './activity.service';
import {
  AnalyticsForRangeDTO,
  ActivityDistribution,
  TimeBar,
  SessionStatistics,
} from '../dto/analytics.dto';
import { ISessionPart } from '../model/sessionPart.model';
import { ISession } from '../model/session.model';
import { IActivity } from '../model/activity.model';
import { getTodayRange } from '../helpers/getTodayRange';

import { redisClient } from '../../redisClient';
import { DateTime } from 'luxon';

type TimeBarType = 'hour' | 'day' | 'month' | 'year';

interface GetSessionsStatistics {
  sessionParts: ISessionPart[];
  completedSessions: ISession[];
}

interface GetActivityDistributionsOptions {
  allSessionsAmount: number;
  allSpentTimeSeconds: number;
  allPausedAmount: number;
  sessionParts: ISessionPart[];
  completedSessions: ISession[];
  userActivities: IActivity[];
}

interface GetTimeBarsOptions {
  startOfRange: Date;
  endOfRange: Date;
  sessionParts: ISessionPart[];
  completedSessions: ISession[];
  barType: TimeBarType;
  timezone: string;
  userActivities: IActivity[];
}

interface GetAnalyticsForRangeOptions {
  startOfRange: Date;
  endOfRange: Date;
  userId: string;
  timezone: string;
}

interface MergeActivityDistributionsOptions {
  adsList: ActivityDistribution[][];
}

interface MergeAnalyticsOptions {
  finalObjStartOfRange: Date;
  finalObjEndOfRange: Date;
  untilTodayObj: AnalyticsForRangeDTO;
  todayObj: AnalyticsForRangeDTO;
  timezone: string;
}

const analyticsService = {
  getSessionsStatistics,
  getActivityDistributions,
  getTimeBarType,
  getTimeBars,
  getAnalyticsForRangeInternal,
  getAnalyticsForRangeWithCache,
  mergeSessionStatistics,
  mergeActivityDistributions,
  mergeAnalytics,
  invalidateCache,
};

function getSessionsStatistics({
  sessionParts,
  completedSessions,
}: GetSessionsStatistics): SessionStatistics {
  const sessionsAmount = completedSessions.length;

  const spentTimeSeconds = sessionParts.reduce(
    (spentTimeSeconds, sessionPart) =>
      spentTimeSeconds + sessionPart.spentTimeSeconds,
    0
  );

  const pausedSessionParts = sessionParts.filter((part) => part.paused);
  const pausedAmount = pausedSessionParts.length;

  return {
    sessionsAmount,
    spentTimeSeconds,
    pausedAmount,
  };
}

function getActivityDistributions({
  allSessionsAmount,
  allSpentTimeSeconds,
  allPausedAmount,
  sessionParts,
  completedSessions,
  userActivities,
}: GetActivityDistributionsOptions): ActivityDistribution[] {
  let activityDistributions: ActivityDistribution[] = [];

  activityDistributions = userActivities.map((activity) => {
    const activityDistribution: ActivityDistribution = {
      activityName: activity.name,
      sessionStatistics: {
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        pausedAmount: 0,
      },
    };
    return activityDistribution;
  });

  let activitiesSeconds: number = 0;
  let activitiesSessions: number = 0;
  let activitiesPaused: number = 0;

  // set sessionsAmount to activityDistributions
  completedSessions.forEach((session) => {
    if (session.activity) {
      const adIndex: number = activityDistributions.findIndex(
        (ad) => ad.activityName === session.activity.name
      );
      activityDistributions[adIndex].sessionStatistics.sessionsAmount += 1;
      activitiesSessions += 1;
    }
  });

  // set spentTimeSeconds and pausedAmount to activityDistributions
  sessionParts.forEach((part) => {
    if (part.session.activity) {
      const adIndex: number = activityDistributions.findIndex(
        (ad) => ad.activityName === part.session.activity.name
      );

      activityDistributions[adIndex].sessionStatistics.spentTimeSeconds +=
        part.spentTimeSeconds;
      activitiesSeconds += part.spentTimeSeconds;

      if (part.paused) {
        activityDistributions[adIndex].sessionStatistics.pausedAmount += 1;
        activitiesPaused += 1;
      }
    }
  });

  // delete empty activity distributions
  activityDistributions = activityDistributions.filter(
    (ad) =>
      ad.sessionStatistics.sessionsAmount > 0 ||
      ad.sessionStatistics.spentTimeSeconds > 0 ||
      ad.sessionStatistics.pausedAmount > 0
  );

  // set without activity to activityDistributions
  const woActivitySessions = allSessionsAmount - activitiesSessions;
  const woActivitySeconds = allSpentTimeSeconds - activitiesSeconds;
  const woActivityPaused = allPausedAmount - activitiesPaused;
  if (woActivitySeconds > 0) {
    activityDistributions.push({
      activityName: 'Without activity',
      sessionStatistics: {
        sessionsAmount: woActivitySessions,
        spentTimeSeconds: woActivitySeconds,
        pausedAmount: woActivityPaused,
      },
    });
  }

  return activityDistributions;
}

function getTimeBarType(startOfRange: Date, endOfRange: Date): TimeBarType {
  let daysInRange = Math.ceil(
    (endOfRange.getTime() - startOfRange.getTime()) / (1000 * 60 * 60 * 24) // ms in one day
  );
  if (daysInRange == 1) {
    return 'hour';
  } else if (daysInRange <= 31) {
    return 'day';
  } else if (daysInRange <= 732) {
    return 'month';
  } else {
    return 'year';
  }
}

// TODO: Так как bar type можно передавать сюда, то надо добавить какие-то проверки?
function getTimeBars({
  startOfRange,
  endOfRange,
  barType,
  timezone,
  sessionParts,
  completedSessions,
  userActivities,
}: GetTimeBarsOptions): TimeBar[] {
  if (endOfRange.getTime() <= startOfRange.getTime()) {
    return [];
  }

  let timeBars: TimeBar[] = [];

  let prevPeriod = new Date(startOfRange);
  let nextPeriod = new Date(prevPeriod);

  if (barType == 'hour') {
    // if date is exact start of hour (0 minutes)
    if (prevPeriod.getMinutes() == 0) {
      nextPeriod.setHours(nextPeriod.getHours() + 1);
    } else {
      nextPeriod.setMinutes(60);
    }
  } else if (barType == 'day') {
    const dt = DateTime.fromJSDate(nextPeriod, { zone: timezone });
    // if date is exact start of day in given time zone
    if (
      dt.hour === 0 &&
      dt.minute === 0 &&
      dt.second === 0 &&
      dt.millisecond === 0
    ) {
      nextPeriod.setDate(nextPeriod.getDate() + 1);
    } else {
      const startOfNextDay = dt.plus({ days: 1 }).startOf('day');
      nextPeriod = startOfNextDay.toJSDate();
    }
  } else if (barType == 'month') {
    const dt = DateTime.fromJSDate(nextPeriod, { zone: timezone });
    // if date is exact start of month in given time zone
    if (
      dt.day === 1 &&
      dt.hour === 0 &&
      dt.minute === 0 &&
      dt.second === 0 &&
      dt.millisecond === 0
    ) {
      const nextPeriodLuxon = DateTime.fromJSDate(nextPeriod, {
        zone: timezone,
      }).plus({ months: 1 });
      nextPeriod = nextPeriodLuxon.toJSDate();
    } else {
      const startOfNextMonth = dt.plus({ months: 1 }).startOf('month');
      nextPeriod = startOfNextMonth.toJSDate();
    }
  } else {
    // if bar type is year
    return [];
  }

  while (true) {
    const filteredSessionParts = sessionParts.filter((sessionPart) => {
      const createdDate = sessionPart.createdDate.getTime();

      return (
        createdDate >= prevPeriod.getTime() &&
        createdDate < nextPeriod.getTime()
      );
    });
    const filteredSessions = completedSessions.filter((session) => {
      const completedDate = session.updatedDate.getTime();

      return (
        completedDate >= prevPeriod.getTime() &&
        completedDate < nextPeriod.getTime()
      );
    });

    const barSpentTimeSeconds = filteredSessionParts.reduce(
      (total: number, sessionPart) => total + sessionPart.spentTimeSeconds,
      0
    );
    const barSessionsAmount = filteredSessions.length;
    const barPausedAmount = filteredSessionParts.filter(
      (part) => part.paused
    ).length;

    if (nextPeriod.getTime() > endOfRange.getTime()) {
      nextPeriod = new Date(endOfRange);
    }

    timeBars.push({
      startOfRange: new Date(prevPeriod),
      endOfRange: new Date(nextPeriod),
      sessionStatistics: {
        spentTimeSeconds: barSpentTimeSeconds,
        sessionsAmount: barSessionsAmount,
        pausedAmount: barPausedAmount,
      },
      activityDistribution: analyticsService.getActivityDistributions({
        allSessionsAmount: barSessionsAmount,
        allSpentTimeSeconds: barSpentTimeSeconds,
        allPausedAmount: barPausedAmount,
        sessionParts: filteredSessionParts,
        completedSessions: filteredSessions,
        userActivities,
      }),
    });

    if (nextPeriod.getTime() == endOfRange.getTime()) {
      break;
    }

    // change periods
    prevPeriod = new Date(nextPeriod);
    if (barType == 'hour') {
      nextPeriod.setHours(nextPeriod.getHours() + 1);
    } else if (barType == 'day') {
      nextPeriod.setDate(nextPeriod.getDate() + 1);
    } else if (barType == 'month') {
      const nextPeriodLuxon = DateTime.fromJSDate(nextPeriod, {
        zone: timezone,
      }).plus({ months: 1 });
      nextPeriod = nextPeriodLuxon.toJSDate();
    }
  }

  return timeBars;
}

async function getAnalyticsForRangeInternal({
  startOfRange,
  endOfRange,
  userId,
  timezone,
}: GetAnalyticsForRangeOptions): Promise<AnalyticsForRangeDTO> {
  if (startOfRange > new Date()) {
    return {
      sessionStatistics: {
        spentTimeSeconds: 0,
        sessionsAmount: 0,
        pausedAmount: 0,
      },
      activityDistribution: [],
      timeBars: [],
    };
  }

  const sessionPartsForRange =
    await sessionPartService.getSessionPartsInDateRange({
      startRange: startOfRange,
      endRange: endOfRange,
      userId,
    });
  const completedSessionsForRange = await sessionService.getSessions({
    filter: {
      updatedDate: { $gte: startOfRange, $lte: endOfRange },
      completed: true,
    },
    userId,
  });

  const sessionStatistics = analyticsService.getSessionsStatistics({
    sessionParts: sessionPartsForRange,
    completedSessions: completedSessionsForRange,
  });

  const userActivities = await activityService.getActivities({ userId });

  const activityDistribution = analyticsService.getActivityDistributions({
    allSessionsAmount: sessionStatistics.sessionsAmount,
    allSpentTimeSeconds: sessionStatistics.spentTimeSeconds,
    allPausedAmount: sessionStatistics.pausedAmount,
    sessionParts: sessionPartsForRange,
    completedSessions: completedSessionsForRange,
    userActivities,
  });

  const timeBars = analyticsService.getTimeBars({
    startOfRange,
    endOfRange,
    sessionParts: sessionPartsForRange,
    completedSessions: completedSessionsForRange,
    barType: analyticsService.getTimeBarType(startOfRange, endOfRange),
    timezone,
    userActivities,
  });

  const analyticsForRange: AnalyticsForRangeDTO = {
    sessionStatistics,
    activityDistribution: activityDistribution,
    timeBars,
  };

  return analyticsForRange;
}

async function getAnalyticsForRangeWithCache({
  startOfRange,
  endOfRange,
  userId,
  timezone,
}: GetAnalyticsForRangeOptions): Promise<AnalyticsForRangeDTO> {
  try {
    const { startOfToday, startOfTomorrow } = getTodayRange(timezone);

    // if it's today analytics
    if (startOfRange >= startOfToday && endOfRange <= startOfTomorrow) {
      const analyticsForToday =
        await analyticsService.getAnalyticsForRangeInternal({
          startOfRange,
          endOfRange,
          userId,
          timezone,
        });

      return analyticsForToday;
    }

    // if the date range includes any parts of today
    if (endOfRange > startOfToday) {
      const analyticsForToday =
        await analyticsService.getAnalyticsForRangeInternal({
          startOfRange:
            startOfRange > startOfToday ? startOfRange : startOfToday,
          endOfRange:
            endOfRange < startOfTomorrow ? endOfRange : startOfTomorrow,
          userId,
          timezone,
        });

      const cacheKey = `analytics:${userId}:${startOfRange.toISOString()}:${startOfToday.toISOString()}`;

      const cacheValue = await redisClient.get(cacheKey);
      if (cacheValue) {
        const analyticsUntilToday: AnalyticsForRangeDTO =
          JSON.parse(cacheValue);
        return analyticsService.mergeAnalytics({
          finalObjStartOfRange: startOfRange,
          finalObjEndOfRange: endOfRange,
          untilTodayObj: analyticsUntilToday,
          todayObj: analyticsForToday,
          timezone,
        });
      }

      const analyticsUntilToday =
        await analyticsService.getAnalyticsForRangeInternal({
          startOfRange,
          endOfRange: startOfToday,
          userId,
          timezone,
        });

      await redisClient.set(cacheKey, JSON.stringify(analyticsUntilToday), {
        expiration: {
          type: 'EXAT',
          value: Math.trunc(startOfTomorrow.getTime() / 1000),
        }, // start of tomorrow (unix timestamp)
      });

      return analyticsService.mergeAnalytics({
        finalObjStartOfRange: startOfRange,
        finalObjEndOfRange: endOfRange,
        untilTodayObj: analyticsUntilToday,
        todayObj: analyticsForToday,
        timezone,
      });
    } else {
      const cacheKey = `analytics:${userId}:${startOfRange.toISOString()}:${endOfRange.toISOString()}`;

      const cacheValue = await redisClient.get(cacheKey);
      if (cacheValue) {
        return JSON.parse(cacheValue) as AnalyticsForRangeDTO;
      }

      const analyticsForRange =
        await analyticsService.getAnalyticsForRangeInternal({
          startOfRange,
          endOfRange,
          userId,
          timezone,
        });

      await redisClient.set(cacheKey, JSON.stringify(analyticsForRange), {
        expiration: { type: 'EX', value: 604800 }, // 7 days
      });

      return analyticsForRange;
    }
  } catch (e) {
    throw e;
  }
}

function mergeSessionStatistics(
  statisticsList: SessionStatistics[]
): SessionStatistics {
  const sessionsAmount = statisticsList.reduce(
    (amount, statistics) => amount + statistics.sessionsAmount,
    0
  );
  const spentTimeSeconds = statisticsList.reduce(
    (seconds, statistics) => seconds + statistics.spentTimeSeconds,
    0
  );
  const pausedAmount = statisticsList.reduce(
    (amount, statistics) => amount + statistics.pausedAmount,
    0
  );

  return {
    sessionsAmount,
    spentTimeSeconds,
    pausedAmount,
  };
}

function mergeActivityDistributions({
  adsList,
}: MergeActivityDistributionsOptions): ActivityDistribution[] {
  if (adsList.length == 0) {
    return [];
  }
  if (adsList.length == 1) {
    return adsList[0];
  }

  let finalAd: ActivityDistribution[] = adsList[0];
  for (let i = 1; i < adsList.length; i++) {
    finalAd = finalAd.map((ad) => {
      for (let j = 0; j < adsList[i].length; j++) {
        if (ad.activityName === adsList[i][j].activityName) {
          const {
            activityName,
            sessionStatistics: {
              sessionsAmount,
              spentTimeSeconds,
              pausedAmount,
            },
          } = adsList[i][j];
          adsList[i] = adsList[i].filter(
            (ad) => ad.activityName !== activityName
          );

          return {
            activityName: ad.activityName,
            sessionStatistics: {
              sessionsAmount:
                ad.sessionStatistics.sessionsAmount + sessionsAmount,
              spentTimeSeconds:
                ad.sessionStatistics.spentTimeSeconds + spentTimeSeconds,
              pausedAmount: ad.sessionStatistics.pausedAmount + pausedAmount,
            },
          };
        }
      }

      return ad;
    });

    finalAd = finalAd.concat(adsList[i]);
  }

  return finalAd;
}

function mergeAnalytics({
  finalObjStartOfRange,
  finalObjEndOfRange,
  untilTodayObj,
  todayObj,
  timezone,
}: MergeAnalyticsOptions): AnalyticsForRangeDTO {
  const finalObj: AnalyticsForRangeDTO = {
    sessionStatistics: analyticsService.mergeSessionStatistics([
      untilTodayObj.sessionStatistics,
      todayObj.sessionStatistics,
    ]),
    activityDistribution: [],
    timeBars: [],
  };

  finalObj.activityDistribution = analyticsService.mergeActivityDistributions({
    adsList: [
      untilTodayObj.activityDistribution,
      todayObj.activityDistribution,
    ],
  });

  const { startOfToday, startOfTomorrow } = getTodayRange(timezone);

  const finalObjTimeBarType = analyticsService.getTimeBarType(
    finalObjStartOfRange,
    finalObjEndOfRange
  );
  let finalObjTimeBars: TimeBar[] = [];
  if (finalObjTimeBarType == 'hour') {
    finalObjTimeBars = [...untilTodayObj.timeBars, ...todayObj.timeBars];
  } else if (finalObjTimeBarType == 'day') {
    let untilTodayObjTimeBars = untilTodayObj.timeBars;

    if (
      startOfToday.getTime() - finalObjStartOfRange.getTime() <= 86_400_000 &&
      startOfToday > finalObjStartOfRange
    ) {
      // if until today obj is day or less than day
      untilTodayObjTimeBars = [];

      untilTodayObjTimeBars.push({
        startOfRange: finalObjStartOfRange,
        endOfRange: startOfToday,
        sessionStatistics: untilTodayObj.sessionStatistics,
        activityDistribution: untilTodayObj.activityDistribution,
      });
    }

    const todayTimeBar: TimeBar = {
      startOfRange: startOfToday,
      endOfRange:
        finalObjEndOfRange < startOfTomorrow
          ? finalObjEndOfRange
          : startOfTomorrow,
      sessionStatistics: todayObj.sessionStatistics,
      activityDistribution: todayObj.activityDistribution,
    };

    const afterTodayTimeBars: TimeBar[] = analyticsService.getTimeBars({
      startOfRange: startOfTomorrow,
      endOfRange: finalObjEndOfRange,
      barType: 'day',
      sessionParts: [],
      completedSessions: [],
      timezone,
      userActivities: [],
    });

    finalObjTimeBars = [
      ...untilTodayObjTimeBars,
      todayTimeBar,
      ...afterTodayTimeBars,
    ];
  } else if (finalObjTimeBarType == 'month') {
    const startOfNextMonth = DateTime.fromJSDate(startOfToday, {
      zone: timezone,
    })
      .plus({ months: 1 })
      .startOf('month')
      .toJSDate();
    const afterCurrentMonthTimeBars = analyticsService.getTimeBars({
      startOfRange: startOfNextMonth,
      endOfRange: finalObjEndOfRange,
      barType: 'month',
      sessionParts: [],
      completedSessions: [],
      timezone,
      userActivities: [],
    });

    let untilTodayTimeBars = untilTodayObj.timeBars;
    if (startOfToday.getTime() - finalObjStartOfRange.getTime() <= 86_400_000) {
      // if until today obj is day or less than day OR start of range is today
      const isStartingFromToday = finalObjStartOfRange >= startOfToday;

      const currentMonthTimeBar: TimeBar = {
        startOfRange: finalObjStartOfRange,
        endOfRange:
          finalObjEndOfRange < startOfNextMonth
            ? finalObjEndOfRange
            : startOfNextMonth,
        sessionStatistics: isStartingFromToday
          ? todayObj.sessionStatistics
          : analyticsService.mergeSessionStatistics([
              untilTodayObj.sessionStatistics,
              todayObj.sessionStatistics,
            ]),
        activityDistribution: isStartingFromToday
          ? todayObj.activityDistribution
          : analyticsService.mergeActivityDistributions({
              adsList: [
                untilTodayObj.activityDistribution,
                todayObj.activityDistribution,
              ],
            }),
      };

      finalObjTimeBars = [currentMonthTimeBar, ...afterCurrentMonthTimeBars];
    } else if (
      analyticsService.getTimeBarType(
        new Date(untilTodayTimeBars[0].startOfRange),
        new Date(untilTodayTimeBars[0].endOfRange)
      ) == 'hour'
    ) {
      // TODO: странная проверка, надо ее сделать нормальной
      // if until today obj is month or less than month (timeBarType of range is day, timeBarType of bar is hour)
      const untilTodayTimeBarsSessionsAmount = untilTodayTimeBars.reduce(
        (totalSessionsAmount, timeBar) =>
          totalSessionsAmount + timeBar.sessionStatistics.sessionsAmount,
        0
      );
      const untilTodayTimeBarsSpentSeconds = untilTodayTimeBars.reduce(
        (totalSpentTimeSeconds, timeBar) =>
          totalSpentTimeSeconds + timeBar.sessionStatistics.spentTimeSeconds,
        0
      );
      const untilTodayTimeBarsPausedAmount = untilTodayTimeBars.reduce(
        (totalPausedAmount, timeBar) =>
          totalPausedAmount + timeBar.sessionStatistics.pausedAmount,
        0
      );
      const untilTodayTimeBarsAd = analyticsService.mergeActivityDistributions({
        adsList: [
          ...untilTodayTimeBars.map((timeBar) => timeBar.activityDistribution),
        ],
      });

      const startOfTodayLuxon = DateTime.fromJSDate(startOfToday, {
        zone: timezone,
      });
      if (startOfTodayLuxon.day === 1) {
        const untilTodayTimeBar: TimeBar = {
          startOfRange: untilTodayTimeBars[0].startOfRange,
          endOfRange: startOfToday,
          sessionStatistics: {
            sessionsAmount: untilTodayTimeBarsSessionsAmount,
            spentTimeSeconds: untilTodayTimeBarsSpentSeconds,
            pausedAmount: untilTodayTimeBarsPausedAmount,
          },
          activityDistribution: untilTodayTimeBarsAd,
        };

        const currentMonthTimeBar: TimeBar = {
          startOfRange: startOfToday,
          endOfRange: startOfNextMonth,
          sessionStatistics: todayObj.sessionStatistics,
          activityDistribution: todayObj.activityDistribution,
        };

        finalObjTimeBars = [
          untilTodayTimeBar,
          currentMonthTimeBar,
          ...afterCurrentMonthTimeBars,
        ];
      } else {
        // TODO: не всегда сбор всех дней в один таймбар будет означать, что все эти дни относятся к текущему месяцу
        const currentMonthTimeBar: TimeBar = {
          startOfRange: untilTodayTimeBars[0].startOfRange,
          endOfRange: startOfNextMonth,
          sessionStatistics: {
            sessionsAmount:
              untilTodayTimeBarsSessionsAmount +
              todayObj.sessionStatistics.sessionsAmount,
            spentTimeSeconds:
              untilTodayTimeBarsSpentSeconds +
              todayObj.sessionStatistics.spentTimeSeconds,
            pausedAmount:
              untilTodayTimeBarsPausedAmount +
              todayObj.sessionStatistics.pausedAmount,
          },
          activityDistribution: analyticsService.mergeActivityDistributions({
            adsList: [untilTodayTimeBarsAd, todayObj.activityDistribution],
          }),
        };

        finalObjTimeBars = [currentMonthTimeBar, ...afterCurrentMonthTimeBars];
      }
    } else {
      // if until today obj is more than month
      const startOfTodayLuxon = DateTime.fromJSDate(startOfToday, {
        zone: timezone,
      });
      if (startOfTodayLuxon.day === 1) {
        const currentMonthTimeBar: TimeBar = {
          startOfRange: startOfToday,
          endOfRange:
            finalObjEndOfRange < startOfNextMonth
              ? finalObjEndOfRange
              : startOfNextMonth,
          sessionStatistics: todayObj.sessionStatistics,
          activityDistribution: todayObj.activityDistribution,
        };

        finalObjTimeBars = [
          ...untilTodayTimeBars,
          currentMonthTimeBar,
          ...afterCurrentMonthTimeBars,
        ];
      } else {
        const currentMonthUntilTodayTimeBar = untilTodayTimeBars.pop();
        const currentMonthTimeBar: TimeBar = {
          startOfRange: currentMonthUntilTodayTimeBar!.startOfRange,
          endOfRange:
            finalObjEndOfRange < startOfNextMonth
              ? finalObjEndOfRange
              : startOfNextMonth,
          sessionStatistics: analyticsService.mergeSessionStatistics([
            currentMonthUntilTodayTimeBar!.sessionStatistics,
            todayObj.sessionStatistics,
          ]),
          activityDistribution: analyticsService.mergeActivityDistributions({
            adsList: [
              currentMonthUntilTodayTimeBar!.activityDistribution,
              todayObj.activityDistribution,
            ],
          }),
        };

        finalObjTimeBars = [
          ...untilTodayTimeBars,
          currentMonthTimeBar,
          ...afterCurrentMonthTimeBars,
        ];
      }
    }
  }
  finalObj.timeBars = finalObjTimeBars;

  return finalObj;
}

// TODO: делать инвалидацию более эффективно. 1)надо использовать scan вместо keys,
// 2)после изменения названия активности, достаточно просто везде поменять его название, удалять все ключи не надо. пока не знаю, является ли норм практикой модификация значения ключа
async function invalidateCache(userId: string) {
  const userKeys = await redisClient.keys(`analytics:${userId}*`);
  if (userKeys.length > 0) {
    await redisClient.del(userKeys);
  }
}

export default analyticsService;
