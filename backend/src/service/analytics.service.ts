import sessionService from '../service/session.service';
import sessionPartService from './sessionPart.service';
import activityService from './activity.service';
import {
  AnalyticsForRangeDTO,
  ActivityDistribution,
  TimeBar,
} from '../dto/analytics.dto';
import { ISessionPart } from '../model/sessionPart.model';
import { ISession } from '../model/session.model';
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
  sessionParts: ISessionPart[];
  completedSessions: ISession[];
  userId: string;
}

interface GetTimeBarsOptions {
  startOfRange: Date;
  endOfRange: Date;
  sessionParts: ISessionPart[];
  completedSessions: ISession[];
  barType: TimeBarType;
  timezone: string;
}

interface GetAnalyticsForRangeOptions {
  startOfRange: Date;
  endOfRange: Date;
  userId: string;
  timezone: string;
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
  getAnalyticsForRange,
  getAnalyticsForRangeWithCache,
  mergeAnalytics,
};

function getSessionsStatistics({
  sessionParts,
  completedSessions,
}: GetSessionsStatistics): {
  sessionsAmount: number;
  spentTimeSeconds: number;
} {
  const sessionsAmount = completedSessions.length;
  const spentTimeSeconds = sessionParts.reduce(
    (spentTimeSeconds, sessionPart) =>
      spentTimeSeconds + sessionPart.spentTimeSeconds,
    0
  );

  return {
    sessionsAmount,
    spentTimeSeconds,
  };
}

async function getActivityDistributions({
  allSessionsAmount,
  allSpentTimeSeconds,
  sessionParts,
  completedSessions,
  userId,
}: GetActivityDistributionsOptions): Promise<ActivityDistribution[]> {
  let activityDistributions: ActivityDistribution[] = [];

  const activities = await activityService.getActivities({
    userId,
  });
  activityDistributions = activities.map((activity) => {
    const activityDistribution: ActivityDistribution = {
      activityName: activity.name,
      sessionsAmount: 0,
      spentTimeSeconds: 0,
    };
    return activityDistribution;
  });

  let activitiesSeconds: number = 0;
  let activitiesSessions: number = 0;

  // set sessionsAmount to activityDistributions
  completedSessions.forEach((session) => {
    if (session.activity) {
      const activityDistributionIndex: number = activityDistributions.findIndex(
        (activityDistribution) =>
          activityDistribution.activityName === session.activity.name
      );
      activityDistributions[activityDistributionIndex].sessionsAmount += 1;

      activitiesSessions += 1;
    }
  });

  // set spentTimeSeconds to activityDistributions
  sessionParts.forEach((sessionPart) => {
    if (sessionPart.session.activity) {
      const activityDistributionIndex: number = activityDistributions.findIndex(
        (activityDistribution) =>
          activityDistribution.activityName ===
          sessionPart.session.activity.name
      );
      activityDistributions[activityDistributionIndex].spentTimeSeconds +=
        sessionPart.spentTimeSeconds;

      activitiesSeconds += sessionPart.spentTimeSeconds;
    }
  });

  // delete empty activity distributions
  activityDistributions = activityDistributions.filter(
    (activityDistribution) =>
      activityDistribution.sessionsAmount !== 0 ||
      activityDistribution.spentTimeSeconds !== 0
  );

  // set without activity to activityDistributions
  const woActivitySessions = allSessionsAmount - activitiesSessions;
  const woActivitySeconds = allSpentTimeSeconds - activitiesSeconds;
  if (woActivitySeconds > 0) {
    activityDistributions.push({
      activityName: 'Without activity',
      sessionsAmount: woActivitySessions,
      spentTimeSeconds: woActivitySeconds,
    });
  }

  return activityDistributions;
}

function getTimeBarType(startOfRange: Date, endOfRange: Date): TimeBarType {
  let daysInRange = Math.ceil(
    (endOfRange.getTime() - startOfRange.getTime()) / (1000 * 60 * 60 * 24)
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

function getTimeBars({
  startOfRange,
  endOfRange,
  barType,
  timezone,
  sessionParts,
  completedSessions,
}: GetTimeBarsOptions): TimeBar[] {
  if (endOfRange.getTime() <= startOfRange.getTime()) {
    return [];
  }

  let timeBars: TimeBar[] = [];

  let prevPeriod = new Date(startOfRange);
  let nextPeriod = new Date(prevPeriod);

  if (barType == 'day') {
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
    // if bar type is year or hour
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
    const barSessionsAmount = filteredSessions.reduce(
      (total: number) => total + 1,
      0
    );

    if (nextPeriod.getTime() > endOfRange.getTime()) {
      nextPeriod = new Date(endOfRange);
    }

    timeBars.push({
      startOfRange: new Date(prevPeriod),
      endOfRange: new Date(nextPeriod),
      spentTimeSeconds: barSpentTimeSeconds,
      sessionsAmount: barSessionsAmount,
    });

    if (nextPeriod.getTime() == endOfRange.getTime()) {
      break;
    }

    if (barType == 'day') {
      prevPeriod = new Date(nextPeriod);
      nextPeriod.setDate(nextPeriod.getDate() + 1);
    } else if (barType == 'month') {
      prevPeriod = new Date(nextPeriod);

      const nextPeriodLuxon = DateTime.fromJSDate(nextPeriod, {
        zone: timezone,
      }).plus({ months: 1 });
      nextPeriod = nextPeriodLuxon.toJSDate();
    }
  }

  return timeBars;
}

async function getAnalyticsForRange({
  startOfRange,
  endOfRange,
  userId,
  timezone,
}: GetAnalyticsForRangeOptions): Promise<AnalyticsForRangeDTO> {
  if (startOfRange > new Date()) {
    return {
      sessionsAmount: 0,
      spentTimeSeconds: 0,
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

  const { sessionsAmount, spentTimeSeconds } =
    analyticsService.getSessionsStatistics({
      sessionParts: sessionPartsForRange,
      completedSessions: completedSessionsForRange,
    });

  const activityDistribution = await analyticsService.getActivityDistributions({
    allSessionsAmount: sessionsAmount,
    allSpentTimeSeconds: spentTimeSeconds,
    sessionParts: sessionPartsForRange,
    completedSessions: completedSessionsForRange,
    userId,
  });

  const timeBars = analyticsService.getTimeBars({
    startOfRange,
    endOfRange,
    sessionParts: sessionPartsForRange,
    completedSessions: completedSessionsForRange,
    barType: analyticsService.getTimeBarType(startOfRange, endOfRange),
    timezone,
  });

  const analyticsForRange: AnalyticsForRangeDTO = {
    sessionsAmount,
    spentTimeSeconds,
    activityDistribution,
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
      const analyticsForToday = await analyticsService.getAnalyticsForRange({
        startOfRange: startOfToday,
        endOfRange: startOfTomorrow,
        userId,
        timezone,
      });

      return analyticsForToday;
    }

    // if the date range includes any parts of today
    if (endOfRange > startOfToday) {
      const cacheKey = await redisClient.get(
        `analytics:${userId}:${startOfRange.toISOString()}:${startOfToday.toISOString()}`
      );
      if (cacheKey) {
        const analyticsUntilToday: AnalyticsForRangeDTO = JSON.parse(cacheKey);
        const analyticsForToday = await analyticsService.getAnalyticsForRange({
          startOfRange:
            startOfRange > startOfToday ? startOfRange : startOfToday,
          endOfRange:
            endOfRange < startOfTomorrow ? endOfRange : startOfTomorrow,
          userId,
          timezone,
        });

        return analyticsService.mergeAnalytics({
          finalObjStartOfRange: startOfRange,
          finalObjEndOfRange: endOfRange,
          untilTodayObj: analyticsUntilToday,
          todayObj: analyticsForToday,
          timezone,
        });
      }

      const analyticsUntilToday = await analyticsService.getAnalyticsForRange({
        startOfRange,
        endOfRange: startOfToday,
        userId,
        timezone,
      });
      const analyticsForToday = await analyticsService.getAnalyticsForRange({
        startOfRange: startOfRange > startOfToday ? startOfRange : startOfToday,
        endOfRange: endOfRange < startOfTomorrow ? endOfRange : startOfTomorrow,
        userId,
        timezone,
      });

      const newCacheKey = `analytics:${userId}:${startOfRange.toISOString()}:${startOfToday.toISOString()}`;
      redisClient.set(newCacheKey, JSON.stringify(analyticsUntilToday), {
        expiration: { type: 'EXAT', value: startOfTomorrow.getTime() / 1000 }, // start of tomorrow (unix timestamp)
      });

      return analyticsService.mergeAnalytics({
        finalObjStartOfRange: startOfRange,
        finalObjEndOfRange: endOfRange,
        untilTodayObj: analyticsUntilToday,
        todayObj: analyticsForToday,
        timezone,
      });
    } else {
      const cacheKey = await redisClient.get(
        `analytics:${userId}:${startOfRange.toISOString()}:${endOfRange.toISOString()}`
      );
      if (cacheKey) {
        return JSON.parse(cacheKey) as AnalyticsForRangeDTO;
      }

      const analyticsForRange = await analyticsService.getAnalyticsForRange({
        startOfRange,
        endOfRange,
        userId,
        timezone,
      });

      const newCacheKey = `analytics:${userId}:${startOfRange.toISOString()}:${endOfRange.toISOString()}`;
      redisClient.set(newCacheKey, JSON.stringify(analyticsForRange), {
        expiration: { type: 'EX', value: 604800 }, // 7 days
      });

      return analyticsForRange;
    }
  } catch (e) {
    throw e;
  }
}

function mergeAnalytics({
  finalObjStartOfRange,
  finalObjEndOfRange,
  untilTodayObj,
  todayObj,
  timezone,
}: MergeAnalyticsOptions): AnalyticsForRangeDTO {
  const finalObj: AnalyticsForRangeDTO = {
    sessionsAmount: untilTodayObj.sessionsAmount + todayObj.sessionsAmount,
    spentTimeSeconds:
      untilTodayObj.spentTimeSeconds + todayObj.spentTimeSeconds,
    activityDistribution: [],
    timeBars: [],
  };

  let untilTodayObjAD = untilTodayObj.activityDistribution;
  let todayObjAD = todayObj.activityDistribution;
  untilTodayObjAD = untilTodayObjAD.map((ad: ActivityDistribution) => {
    for (let i = 0; i < todayObjAD.length; i++) {
      if (ad.activityName === todayObjAD[i].activityName) {
        const { activityName, sessionsAmount, spentTimeSeconds } =
          todayObjAD[i];

        todayObjAD = todayObjAD.filter(
          (ad) => ad.activityName !== activityName
        );

        return {
          activityName: ad.activityName,
          sessionsAmount: ad.sessionsAmount + sessionsAmount,
          spentTimeSeconds: ad.spentTimeSeconds + spentTimeSeconds,
        };
      }
    }

    return ad;
  });
  finalObj.activityDistribution = untilTodayObjAD.concat(todayObjAD);

  const { startOfToday, startOfTomorrow } = getTodayRange(timezone);
  const finalObjTimeBarType = analyticsService.getTimeBarType(
    finalObjStartOfRange,
    finalObjEndOfRange
  );
  let finalObjTimeBars: TimeBar[] = [];
  if (finalObjTimeBarType == 'day') {
    let untilTodayObjTimeBars = untilTodayObj.timeBars;
    if (
      untilTodayObjTimeBars.length == 0 &&
      finalObjStartOfRange < startOfToday
    ) {
      // if until today obj is for day or less than day (when timeBarType is hour, there are no time bars)
      untilTodayObjTimeBars.push({
        startOfRange: finalObjStartOfRange,
        endOfRange: startOfToday,
        sessionsAmount: untilTodayObj.sessionsAmount,
        spentTimeSeconds: untilTodayObj.spentTimeSeconds,
      });
    }

    finalObjTimeBars = [
      ...untilTodayObjTimeBars,
      {
        startOfRange: startOfToday,
        endOfRange:
          finalObjEndOfRange < startOfTomorrow
            ? finalObjEndOfRange
            : startOfTomorrow,
        sessionsAmount: todayObj.sessionsAmount,
        spentTimeSeconds: todayObj.spentTimeSeconds,
      },
      ...analyticsService.getTimeBars({
        startOfRange: startOfTomorrow,
        endOfRange: finalObjEndOfRange,
        barType: 'day',
        sessionParts: [],
        completedSessions: [],
        timezone,
      }),
    ];
  } else if (finalObjTimeBarType == 'month') {
    const startOfNextMonth = DateTime.fromJSDate(startOfToday, {
      zone: timezone,
    })
      .plus({ months: 1 })
      .startOf('month')
      .toJSDate();

    let untilTodayTimeBars = untilTodayObj.timeBars;
    if (
      untilTodayTimeBars.length > 0 &&
      analyticsService.getTimeBarType(
        new Date(untilTodayTimeBars[0].startOfRange),
        new Date(untilTodayTimeBars[0].endOfRange)
      ) == 'hour'
    ) {
      const currentMonthTimeBar: TimeBar = {
        startOfRange: untilTodayTimeBars[0].startOfRange,
        endOfRange: startOfNextMonth,
        sessionsAmount:
          untilTodayTimeBars.reduce(
            (totalSessionsAmount, timeBar) =>
              totalSessionsAmount + timeBar.sessionsAmount,
            0
          ) + todayObj.sessionsAmount,
        spentTimeSeconds:
          untilTodayTimeBars.reduce(
            (totalSpentTimeSeconds, timeBar) =>
              totalSpentTimeSeconds + timeBar.spentTimeSeconds,
            0
          ) + todayObj.spentTimeSeconds,
      };

      finalObjTimeBars = [
        currentMonthTimeBar,
        ...analyticsService.getTimeBars({
          startOfRange: startOfNextMonth,
          endOfRange: finalObjEndOfRange,
          barType: 'month',
          sessionParts: [],
          completedSessions: [],
          timezone,
        }),
      ];
    } else {
      const currentMonthTimeBar = untilTodayTimeBars.pop();

      // TODO: что-то сделать с этой логикой, как минимум разнести по отдельным переменным
      finalObjTimeBars = [
        ...untilTodayTimeBars,
        {
          startOfRange: currentMonthTimeBar
            ? currentMonthTimeBar.startOfRange
            : finalObjStartOfRange > startOfToday
            ? startOfToday
            : finalObjStartOfRange,
          endOfRange:
            finalObjEndOfRange < startOfNextMonth
              ? finalObjEndOfRange
              : startOfNextMonth,
          sessionsAmount:
            (currentMonthTimeBar
              ? currentMonthTimeBar.sessionsAmount
              : untilTodayObj.sessionsAmount) + todayObj.sessionsAmount,
          spentTimeSeconds:
            (currentMonthTimeBar
              ? currentMonthTimeBar.spentTimeSeconds
              : untilTodayObj.spentTimeSeconds) + todayObj.spentTimeSeconds,
        },
        ...analyticsService.getTimeBars({
          startOfRange: startOfNextMonth,
          endOfRange: finalObjEndOfRange,
          barType: 'month',
          sessionParts: [],
          completedSessions: [],
          timezone,
        }),
      ];
    }
  }
  finalObj.timeBars = finalObjTimeBars;

  return finalObj;
}

export default analyticsService;
