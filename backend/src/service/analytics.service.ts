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
import DailyAggregate, { IDailyAggregate } from '../model/dailyAggregate.model';
import DailyActivityDistribution, {
  IDailyAD,
} from '../model/dailyActivityDistribution.model';
import { getTodayRange } from '../helpers/getTodayRange';

import { redisClient } from '../../redisClient';
import { DateTime } from 'luxon';

type TimeBarType = 'hour' | 'day' | 'month' | 'year';

interface GetSessionsStatisticsOptions {
  sessionParts: ISessionPart[];
  completedSessions: ISession[];
}

interface GetSessionsStatisticsAggregatesOptions {
  aggregates: IDailyAggregate[];
}

interface BuildADsOptions {
  totalStat: SessionStatistics;
  allActivitiesStat: SessionStatistics;
  userActivities: IActivity[];
  activitiesStatMap: Map<string, SessionStatistics>;
}

interface GetADsOptions {
  totalStat: SessionStatistics;
  sessionParts: ISessionPart[];
  completedSessions: ISession[];
  userActivities: IActivity[];
}

interface GetADsAggregatesOptions {
  totalStat: SessionStatistics;
  dailyAds: IDailyAD[];
  userActivities: IActivity[];
}

interface getBarStatAndAdsOptions {
  dataSource: DataSource;
  startOfPeriod: Date;
  endOfPeriod: Date;
  userActivities: IActivity[];
}

interface GetTimeBarsOptions {
  startOfRange: Date;
  endOfRange: Date;
  barType: TimeBarType;
  timezone: string;
  userActivities: IActivity[];
  dataSource: DataSource;
}

type DataSource =
  | { type: 'raw'; sessionParts: ISessionPart[]; completedSessions: ISession[] }
  | {
      type: 'aggregates';
      dailyAggregates: IDailyAggregate[];
      dailyAds: IDailyAD[];
      timezone: string;
    };

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

interface ApplySessionUpdateToAggregatesOptions {
  userId: string;
  timezone: string;

  // event params
  date: Date;
  addedSpentTimeSeconds: number;
  isPaused: boolean;
  isCompleted: boolean;

  activityId?: string;
}

type UpdateCacheOptions =
  | { type: 'activityUpdated'; activity: IActivity }
  | { type: 'activityDeleted'; activityId: string };

const analyticsService = {
  getSessionsStatistics,
  buildActivityDistributions,
  getActivityDistributions,
  getTimeBarType,
  getBarStatAndAds,
  getTimeBars,
  getSessionsStatisticsAggregates,
  getActivityDistributionsAggregates,
  applySessionUpdateToAggregates,
  getAnalyticsForRangeInternal,
  getAnalyticsForRangeAggregates,
  getAnalyticsForRangeWithCache,
  mergeSessionStatistics,
  mergeActivityDistributions,
  mergeAnalytics,
  invalidateCache,
  updateActivityInAds,
  removeActivityFromAds,
  buildUpdatedCacheValues,
  updateCache,
};

function getSessionsStatistics({
  sessionParts,
  completedSessions,
}: GetSessionsStatisticsOptions): SessionStatistics {
  const sessionsAmount = completedSessions.length;

  const spentTimeSeconds = sessionParts.reduce(
    (spentTimeSeconds, sessionPart) =>
      spentTimeSeconds + sessionPart.spentTimeSeconds,
    0,
  );

  const pausedSessionParts = sessionParts.filter((part) => part.paused);
  const pausedAmount = pausedSessionParts.length;

  return {
    sessionsAmount,
    spentTimeSeconds,
    pausedAmount,
  };
}

function buildActivityDistributions({
  totalStat,
  allActivitiesStat,
  activitiesStatMap,
  userActivities,
}: BuildADsOptions): ActivityDistribution[] {
  const ads: ActivityDistribution[] = [];

  for (const [activityId, stat] of activitiesStatMap) {
    const activity = userActivities.find((activity) =>
      activity._id.equals(activityId),
    );
    if (!activity) {
      continue;
    }

    ads.push({
      id: activity._id.toString(),
      name: activity.name,
      color: activity.color,
      sessionStatistics: stat,
    });
  }

  // set without activity to activityDistributions
  const woStat: SessionStatistics = {
    sessionsAmount: totalStat.sessionsAmount - allActivitiesStat.sessionsAmount,
    spentTimeSeconds:
      totalStat.spentTimeSeconds - allActivitiesStat.spentTimeSeconds,
    pausedAmount: totalStat.pausedAmount - allActivitiesStat.pausedAmount,
  };
  if (woStat.spentTimeSeconds > 0) {
    ads.push({
      id: '0',
      name: 'Without activity',
      color: '#9CA3AF',
      sessionStatistics: woStat,
    });
  }

  return ads;
}

function getActivityDistributions({
  totalStat,
  sessionParts,
  completedSessions,
  userActivities,
}: GetADsOptions): ActivityDistribution[] {
  const activitiesStatMap = new Map<string, SessionStatistics>();

  const allActivitiesStat: SessionStatistics = {
    spentTimeSeconds: 0,
    sessionsAmount: 0,
    pausedAmount: 0,
  };

  // set sessionsAmount to activityDistributions
  for (const session of completedSessions) {
    if (!session.activity) continue;
    const activityId = session.activity.id.toString();

    let activityStat = activitiesStatMap.get(activityId);
    if (!activityStat) {
      activityStat = {
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        pausedAmount: 0,
      };
    }

    activityStat.sessionsAmount += 1;
    allActivitiesStat.sessionsAmount += 1;

    activitiesStatMap.set(activityId, activityStat);
  }

  // set spentTimeSeconds and pausedAmount to activityDistributions
  for (const part of sessionParts) {
    if (!part.session.activity) continue;
    const activityId = part.session.activity.id.toString();

    let activityStat = activitiesStatMap.get(activityId);
    if (!activityStat) {
      activityStat = {
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        pausedAmount: 0,
      };
    }

    activityStat.spentTimeSeconds += part.spentTimeSeconds;
    allActivitiesStat.spentTimeSeconds += part.spentTimeSeconds;
    if (part.paused) {
      activityStat.pausedAmount += 1;
      allActivitiesStat.pausedAmount += 1;
    }

    activitiesStatMap.set(activityId, activityStat);
  }

  return analyticsService.buildActivityDistributions({
    totalStat,
    allActivitiesStat,
    activitiesStatMap,
    userActivities,
  });
}

function getTimeBarType(startOfRange: Date, endOfRange: Date): TimeBarType {
  let daysInRange = Math.ceil(
    (endOfRange.getTime() - startOfRange.getTime()) / (1000 * 60 * 60 * 24), // ms in one day
  );
  if (daysInRange == 1) {
    return 'hour';
  } else if (daysInRange <= 40) {
    return 'day';
  } else if (daysInRange <= 732) {
    return 'month';
  } else {
    return 'year';
  }
}

function getBarStatAndAds({
  startOfPeriod,
  endOfPeriod,
  dataSource,
  userActivities,
}: getBarStatAndAdsOptions): {
  barStat: SessionStatistics;
  barAds: ActivityDistribution[];
} {
  if (dataSource.type === 'raw') {
    const filteredParts = dataSource.sessionParts.filter((part) => {
      const createdDate = part.createdDate.getTime();

      return (
        createdDate >= startOfPeriod.getTime() &&
        createdDate < endOfPeriod.getTime()
      );
    });

    const filteredSessions = dataSource.completedSessions.filter((session) => {
      const completedDate = session.updatedDate.getTime();

      return (
        completedDate >= startOfPeriod.getTime() &&
        completedDate < endOfPeriod.getTime()
      );
    });

    const barStat = analyticsService.getSessionsStatistics({
      sessionParts: filteredParts,
      completedSessions: filteredSessions,
    });

    const barAds = analyticsService.getActivityDistributions({
      totalStat: barStat,
      sessionParts: filteredParts,
      completedSessions: filteredSessions,
      userActivities,
    });

    return { barStat, barAds };
  } else {
    const startOfPeriodISO = DateTime.fromJSDate(startOfPeriod, {
      zone: dataSource.timezone,
    }).toISODate();
    const endOfPeriodISO = DateTime.fromJSDate(endOfPeriod, {
      zone: dataSource.timezone,
    }).toISODate();

    if (!startOfPeriodISO || !endOfPeriodISO) {
      throw new Error('Failed to convert DateTime to ISO Date');
    }

    const filteredAggregates = dataSource.dailyAggregates.filter((aggr) => {
      const aggrDate = aggr.date;

      return aggrDate >= startOfPeriodISO && aggrDate < endOfPeriodISO;
    });

    const filteredDailyAds = dataSource.dailyAds.filter((dailyAd) => {
      const adDate = dailyAd.date;

      return adDate >= startOfPeriodISO && adDate < endOfPeriodISO;
    });

    const barStat = analyticsService.getSessionsStatisticsAggregates({
      aggregates: filteredAggregates,
    });
    const barAds = analyticsService.getActivityDistributionsAggregates({
      totalStat: barStat,
      userActivities,
      dailyAds: filteredDailyAds,
    });

    return {
      barStat,
      barAds,
    };
  }
}

// TODO: передавая сюда bar type hour и агрегаты, можно автоматически возвращать пустой массив или типо ошибки
// TODO: Так как bar type можно передавать сюда, то надо добавить какие-то проверки?
function getTimeBars({
  startOfRange,
  endOfRange,
  barType,
  timezone,
  userActivities,
  dataSource,
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
    // if date is exact start of day in user timezone
    if (dt.hour === 0 && dt.minute === 0 && dt.second === 0) {
      nextPeriod.setDate(nextPeriod.getDate() + 1);
    } else {
      const startOfNextDay = dt.plus({ days: 1 }).startOf('day');
      nextPeriod = startOfNextDay.toJSDate();
    }
  } else if (barType == 'month') {
    const dt = DateTime.fromJSDate(nextPeriod, { zone: timezone });
    // if date is exact start of month in user timezone
    if (dt.day === 1 && dt.hour === 0 && dt.minute === 0 && dt.second === 0) {
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
    let barStat: SessionStatistics = {
      spentTimeSeconds: 0,
      sessionsAmount: 0,
      pausedAmount: 0,
    };
    let barAds: ActivityDistribution[] = [];

    if (prevPeriod.getTime() < new Date().getTime()) {
      const { barStat: computedStat, barAds: computedAds } =
        analyticsService.getBarStatAndAds({
          startOfPeriod: prevPeriod,
          endOfPeriod: nextPeriod,
          dataSource,
          userActivities,
        });

      barStat = computedStat;
      barAds = computedAds;
    }

    if (nextPeriod.getTime() > endOfRange.getTime()) {
      nextPeriod = new Date(endOfRange);
    }

    timeBars.push({
      startOfRange: new Date(prevPeriod),
      endOfRange: new Date(nextPeriod),
      sessionStatistics: barStat,
      activityDistribution: barAds,
    });

    if (nextPeriod.getTime() === endOfRange.getTime()) {
      break;
    }

    // change periods
    prevPeriod = new Date(nextPeriod);
    if (barType === 'hour') {
      nextPeriod.setHours(nextPeriod.getHours() + 1);
    } else if (barType === 'day') {
      nextPeriod.setDate(nextPeriod.getDate() + 1);
    } else if (barType === 'month') {
      const nextPeriodLuxon = DateTime.fromJSDate(nextPeriod, {
        zone: timezone,
      }).plus({ months: 1 });
      nextPeriod = nextPeriodLuxon.toJSDate();
    }
  }

  return timeBars;
}

function getSessionsStatisticsAggregates({
  aggregates,
}: GetSessionsStatisticsAggregatesOptions): SessionStatistics {
  const sessionStatistics: SessionStatistics = {
    spentTimeSeconds: 0,
    sessionsAmount: 0,
    pausedAmount: 0,
  };
  for (let i = 0; i < aggregates.length; i++) {
    const aggregate = aggregates[i];

    sessionStatistics.spentTimeSeconds += aggregate.spentTimeSeconds;
    sessionStatistics.sessionsAmount += aggregate.sessionsAmount;
    sessionStatistics.pausedAmount += aggregate.pausedAmount;
  }

  return sessionStatistics;
}

function getActivityDistributionsAggregates({
  totalStat,
  userActivities,
  dailyAds,
}: GetADsAggregatesOptions): ActivityDistribution[] {
  const activitiesStatMap = new Map<string, SessionStatistics>();

  const allActivitiesStat: SessionStatistics = {
    spentTimeSeconds: 0,
    sessionsAmount: 0,
    pausedAmount: 0,
  };

  for (const dailyAd of dailyAds) {
    const activityId = dailyAd.activity.toString();
    let activityStat = activitiesStatMap.get(activityId);
    if (!activityStat) {
      activityStat = {
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        pausedAmount: 0,
      };
    }

    activityStat.spentTimeSeconds += dailyAd.spentTimeSeconds;
    activityStat.sessionsAmount += dailyAd.sessionsAmount;
    activityStat.pausedAmount += dailyAd.pausedAmount;

    activitiesStatMap.set(activityId, activityStat);

    allActivitiesStat.spentTimeSeconds += dailyAd.spentTimeSeconds;
    allActivitiesStat.sessionsAmount += dailyAd.sessionsAmount;
    allActivitiesStat.pausedAmount += dailyAd.pausedAmount;
  }

  return analyticsService.buildActivityDistributions({
    totalStat,
    allActivitiesStat,
    activitiesStatMap,
    userActivities,
  });
}

async function applySessionUpdateToAggregates({
  userId,
  timezone,
  date,
  addedSpentTimeSeconds,
  isPaused,
  isCompleted,
  activityId,
}: ApplySessionUpdateToAggregatesOptions) {
  const dt = DateTime.fromJSDate(date, { zone: timezone });
  const dateISO = dt.toISODate();

  // TODO: можно использовать updateOne, будет оптимизированней
  let todayAggregate = await DailyAggregate.findOne({
    date: dateISO,
    user: userId,
  });
  if (!todayAggregate) {
    todayAggregate = new DailyAggregate({
      date: dateISO,
      user: userId,
      spentTimeSeconds: 0,
      sessionsAmount: 0,
      pausedAmount: 0,
    });
  }

  todayAggregate.spentTimeSeconds += addedSpentTimeSeconds;
  if (isPaused) {
    todayAggregate.pausedAmount += 1;
  }
  if (isCompleted) {
    todayAggregate.sessionsAmount += 1;
  }

  await todayAggregate.save();

  if (!activityId) {
    return;
  }

  // TODO: можно использовать updateOne, будет оптимизированней
  let todayActivityAggregate = await DailyActivityDistribution.findOne({
    date: dateISO,
    user: userId,
    activity: activityId,
  });
  if (!todayActivityAggregate) {
    todayActivityAggregate = new DailyActivityDistribution({
      date: dateISO,
      user: userId,
      activity: activityId,
      spentTimeSeconds: 0,
      sessionsAmount: 0,
      pausedAmount: 0,
    });
  }

  todayActivityAggregate.spentTimeSeconds += addedSpentTimeSeconds;
  if (isPaused) {
    todayActivityAggregate.pausedAmount += 1;
  }
  if (isCompleted) {
    todayActivityAggregate.sessionsAmount += 1;
  }

  await todayActivityAggregate.save();

  // TODO: todayAggregate.save() и todayActivityAggregate.save() должны происходить атомарно
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
    totalStat: sessionStatistics,
    sessionParts: sessionPartsForRange,
    completedSessions: completedSessionsForRange,
    userActivities,
  });

  const timeBars = analyticsService.getTimeBars({
    startOfRange,
    endOfRange,
    barType: analyticsService.getTimeBarType(startOfRange, endOfRange),
    dataSource: {
      type: 'raw',
      sessionParts: sessionPartsForRange,
      completedSessions: completedSessionsForRange,
    },
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

async function getAnalyticsForRangeAggregates({
  startOfRange,
  endOfRange,
  userId,
  timezone,
}: GetAnalyticsForRangeOptions): Promise<AnalyticsForRangeDTO> {
  try {
    if (analyticsService.getTimeBarType(startOfRange, endOfRange) === 'hour') {
      return analyticsService.getAnalyticsForRangeInternal({
        startOfRange,
        endOfRange,
        userId,
        timezone,
      });
    }

    const startOfRangeDt = DateTime.fromJSDate(startOfRange, {
      zone: timezone,
    });
    const endOfRangeDt = DateTime.fromJSDate(endOfRange, { zone: timezone });
    let startOfRangeAggr = startOfRangeDt;
    let endOfRangeAggr = endOfRangeDt;

    let leadingAnalytics: AnalyticsForRangeDTO | null = null;
    let trailingAnalytics: AnalyticsForRangeDTO | null = null;

    // if it's not exact start of day in user timezone
    if (
      startOfRangeDt.hour !== 0 ||
      startOfRangeDt.minute !== 0 ||
      startOfRangeDt.second !== 0
    ) {
      startOfRangeAggr = startOfRangeDt.plus({ days: 1 }).startOf('day');

      leadingAnalytics = await analyticsService.getAnalyticsForRangeInternal({
        startOfRange,
        endOfRange: startOfRangeAggr.toJSDate(),
        userId,
        timezone,
      });
    }

    // if it's not exact start of day in user timezone
    if (
      endOfRangeDt.hour !== 0 ||
      endOfRangeDt.minute !== 0 ||
      endOfRangeDt.second !== 0
    ) {
      endOfRangeAggr = endOfRangeDt.startOf('day');

      trailingAnalytics = await analyticsService.getAnalyticsForRangeInternal({
        startOfRange: endOfRangeAggr.toJSDate(),
        endOfRange,
        userId,
        timezone,
      });
    }

    // console.log(startOfRangeAggr.toISODate());
    // console.log(endOfRangeAggr.toISODate());

    // TODO: а если аналитика начнется в одну часть дня, а закончится в другую часть дня? Получается мы к агрегатам вообще обращаться не будем.
    // В таком случае в идеале надо один раз вызвать getAnalyticsForRangeInternal для изначальных дат
    // ПРИМЕР: 19.04.2026 05:00 - 20.04.2026 19:00
    // startOfRangeAggr станет 2026-04-20, а endOfRangeAggr станет 2026-04-20, от чего мы получим агрегатную аналитику за все 20 число, хотя мы не должны его получать
    // ВОТ В ТАКИХ СЛУЧАЯХ НАДО КАК-ТО ПРОСТО ВЫЗЫВАТЬ getAnalyticsForRangeInternal ДЛЯ ИЗНАЧАЛЬНЫХ ДАТ
    // НО КСТАТИ НА УДИВЛЕНИЕ НА ДАННЫЙ МОМЕНТ МЫ НЕ ПОЛУЧАЕМ АНАЛИТИКУ ЗА ВСЕ 20 ЧИСЛО (dailyAggregates и dailyAds оказываются пустые), однако с формированием таймбаров все равно беда, опять проблема в mergeAnalytics

    const dailyAggregates = await DailyAggregate.find({
      user: userId,
      date: {
        $gte: startOfRangeAggr.toISODate(),
        $lt: endOfRangeAggr.toISODate(),
      },
    });
    const dailyAds = await DailyActivityDistribution.find({
      user: userId,
      date: {
        $gte: startOfRangeAggr.toISODate(),
        $lt: endOfRangeAggr.toISODate(),
      },
    });
    // console.log(dailyAggregates.length);
    // console.log(dailyAds.length);

    const sessionStatistics = analyticsService.getSessionsStatisticsAggregates({
      aggregates: dailyAggregates,
    });

    const userActivities = await activityService.getActivities({ userId });
    const ads = analyticsService.getActivityDistributionsAggregates({
      totalStat: sessionStatistics,
      userActivities,
      dailyAds,
    });

    const startOfRangeAggrDate = startOfRangeAggr.toJSDate();
    const endOfRangeAggrDate = endOfRangeAggr.toJSDate();
    const timeBars = analyticsService.getTimeBars({
      startOfRange: startOfRangeAggrDate,
      endOfRange: endOfRangeAggrDate,
      barType: analyticsService.getTimeBarType(
        startOfRangeAggrDate,
        endOfRangeAggrDate,
      ),
      timezone,
      userActivities,
      dataSource: { type: 'aggregates', dailyAggregates, dailyAds, timezone },
    });

    let aggrAnalytics: AnalyticsForRangeDTO = {
      sessionStatistics,
      activityDistribution: ads,
      timeBars,
    };

    // TODO: тут тоже проблемы с mergeAnalytics. так как в leadingAnalytics есть часовые time bars, они почему-то добавляются в финальный объект, хотя этого быть не должно
    // пример кейса: from=2026-04-20T12:00:00.000Z&to=2026-04-26T21:00:00.000Z. часовые тайм бары от leadingAnalytics (за 20 число) будут в финальном объекте
    if (leadingAnalytics) {
      aggrAnalytics = analyticsService.mergeAnalytics({
        finalObjStartOfRange: startOfRange,
        finalObjEndOfRange: endOfRangeAggrDate,
        untilTodayObj: leadingAnalytics,
        todayObj: aggrAnalytics,
        timezone,
      });
    }

    // TODO: баг в mergeAnalytics ломает у последнего тайм бара отображение startOfRange / endOfRange
    // пример кейса: from=2026-04-15T21:00:00.000Z&to=2026-04-20T19:00:00.000Z. у последнего тайм бара будет такие периоды: 2026-04-20T21:00:00 - 2026-04-20T19:00:00
    if (trailingAnalytics) {
      aggrAnalytics = analyticsService.mergeAnalytics({
        finalObjStartOfRange: startOfRange,
        finalObjEndOfRange: endOfRange,
        untilTodayObj: aggrAnalytics,
        todayObj: trailingAnalytics,
        timezone,
      });
    }

    return aggrAnalytics;
  } catch (e) {
    throw e;
  }
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

      if (analyticsUntilToday.sessionStatistics.spentTimeSeconds > 0) {
        await redisClient.set(cacheKey, JSON.stringify(analyticsUntilToday), {
          expiration: {
            type: 'EXAT',
            value: Math.trunc(startOfTomorrow.getTime() / 1000),
          }, // start of tomorrow (unix timestamp)
        });
      }

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

      if (analyticsForRange.sessionStatistics.spentTimeSeconds > 0) {
        await redisClient.set(cacheKey, JSON.stringify(analyticsForRange), {
          expiration: { type: 'EX', value: 604800 }, // 7 days
        });
      }

      return analyticsForRange;
    }
  } catch (e) {
    throw e;
  }
}

function mergeSessionStatistics(
  statisticsList: SessionStatistics[],
): SessionStatistics {
  const sessionsAmount = statisticsList.reduce(
    (amount, statistics) => amount + statistics.sessionsAmount,
    0,
  );
  const spentTimeSeconds = statisticsList.reduce(
    (seconds, statistics) => seconds + statistics.spentTimeSeconds,
    0,
  );
  const pausedAmount = statisticsList.reduce(
    (amount, statistics) => amount + statistics.pausedAmount,
    0,
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
        if (ad.id === adsList[i][j].id) {
          const { id: activityId, sessionStatistics } = adsList[i][j];
          adsList[i] = adsList[i].filter((ad) => ad.id !== activityId);

          return {
            id: ad.id,
            name: ad.name,
            color: ad.color,
            sessionStatistics: analyticsService.mergeSessionStatistics([
              ad.sessionStatistics,
              sessionStatistics,
            ]),
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
    finalObjEndOfRange,
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
      dataSource: {
        type: 'raw',
        sessionParts: [],
        completedSessions: [],
      },
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
      dataSource: {
        type: 'raw',
        sessionParts: [],
        completedSessions: [],
      },
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
        new Date(untilTodayTimeBars[0].endOfRange),
      ) == 'hour'
    ) {
      // TODO: странная проверка, надо ее сделать нормальной
      // if until today obj is month or less than month (timeBarType of range is day, timeBarType of bar is hour)
      const untilTodayTimeBarsSessionsAmount = untilTodayTimeBars.reduce(
        (totalSessionsAmount, timeBar) =>
          totalSessionsAmount + timeBar.sessionStatistics.sessionsAmount,
        0,
      );
      const untilTodayTimeBarsSpentSeconds = untilTodayTimeBars.reduce(
        (totalSpentTimeSeconds, timeBar) =>
          totalSpentTimeSeconds + timeBar.sessionStatistics.spentTimeSeconds,
        0,
      );
      const untilTodayTimeBarsPausedAmount = untilTodayTimeBars.reduce(
        (totalPausedAmount, timeBar) =>
          totalPausedAmount + timeBar.sessionStatistics.pausedAmount,
        0,
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

async function invalidateCache(userId: string) {
  let cursor: string = '0';
  const userKeys: string[] = [];
  do {
    const result = await redisClient.scan(cursor, {
      MATCH: `analytics:${userId}*`,
      COUNT: 200,
    });

    cursor = result.cursor;
    userKeys.push(...result.keys);
  } while (cursor !== '0');

  if (userKeys.length > 0) {
    await redisClient.del(userKeys);
  }
}

function updateActivityInAds(
  activityDistributions: ActivityDistribution[],
  updatedActivity: IActivity,
): boolean {
  const adIndex = activityDistributions.findIndex(
    (ad) => ad.id === updatedActivity._id.toString(),
  );
  if (adIndex === -1) return false;

  activityDistributions[adIndex].name = updatedActivity.name;
  activityDistributions[adIndex].color = updatedActivity.color;

  return true;
}

function removeActivityFromAds(
  analyticsObject: {
    sessionStatistics: SessionStatistics;
    activityDistribution: ActivityDistribution[];
  },
  deletedActivityId: string,
): boolean {
  const adIndex = analyticsObject.activityDistribution.findIndex(
    (ad) => ad.id === deletedActivityId,
  );
  if (adIndex === -1) return false;

  const deletedAd = analyticsObject.activityDistribution.splice(adIndex, 1)[0];
  const { spentTimeSeconds, sessionsAmount, pausedAmount } =
    deletedAd.sessionStatistics;
  analyticsObject.sessionStatistics.spentTimeSeconds -= spentTimeSeconds;
  analyticsObject.sessionStatistics.sessionsAmount -= sessionsAmount;
  analyticsObject.sessionStatistics.pausedAmount -= pausedAmount;

  return true;
}

function buildUpdatedCacheValues(
  cacheKeys: string[],
  cacheValues: (string | null)[],
  options: UpdateCacheOptions,
): Record<string, string> {
  const updatedCacheValues: Record<string, string> = {};

  for (let i = 0; i < cacheValues.length; i++) {
    const cacheValueJson = cacheValues[i];
    if (!cacheValueJson) continue;
    let cacheValue = JSON.parse(cacheValueJson) as AnalyticsForRangeDTO;
    if (typeof cacheValue !== 'object') continue;

    if (options.type === 'activityUpdated') {
      const updatedActivity = options.activity;
      if (
        !analyticsService.updateActivityInAds(
          cacheValue.activityDistribution,
          updatedActivity,
        )
      ) {
        continue;
      }

      for (let i = 0; i < cacheValue.timeBars.length; i++) {
        analyticsService.updateActivityInAds(
          cacheValue.timeBars[i].activityDistribution,
          updatedActivity,
        );
      }
    } else if (options.type === 'activityDeleted') {
      const deletedActivityId = options.activityId;
      if (
        !analyticsService.removeActivityFromAds(cacheValue, deletedActivityId)
      ) {
        continue;
      }

      for (let i = 0; i < cacheValue.timeBars.length; i++) {
        analyticsService.removeActivityFromAds(
          cacheValue.timeBars[i],
          deletedActivityId,
        );
      }
    }

    updatedCacheValues[`${cacheKeys[i]}`] = JSON.stringify(cacheValue);
  }

  return updatedCacheValues;
}

async function updateCache(userId: string, options: UpdateCacheOptions) {
  let cursor: string = '0';
  const cacheKeys: string[] = [];
  do {
    const result = await redisClient.scan(cursor, {
      MATCH: `analytics:${userId}*`,
      COUNT: 200,
    });

    cursor = result.cursor;
    cacheKeys.push(...result.keys);
  } while (cursor !== '0');

  if (cacheKeys.length === 0) {
    return;
  }

  const cacheValues = await redisClient.mGet(cacheKeys);
  const updatedCacheValues = analyticsService.buildUpdatedCacheValues(
    cacheKeys,
    cacheValues,
    options,
  );

  // TODO: чтобы снизить I/O overhead, вызывать redis.pipeline().execute() для pipeline/transaction (чтобы было одно обращение к redis)
  for (const cacheKey in updatedCacheValues) {
    await redisClient.set(cacheKey, updatedCacheValues[cacheKey], {
      KEEPTTL: true,
    });
  }
}

export default analyticsService;
