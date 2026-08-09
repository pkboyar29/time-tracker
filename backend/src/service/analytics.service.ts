import sessionService from '../service/session.service';
import sessionPartService from './sessionPart.service';
import activityService from './activity.service';
import {
  AnalyticsForRangeDTO,
  ActivityDistribution,
  TimeBar,
  SessionStat,
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

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

interface GetSessionsStatisticsOptions {
  sessionParts: ISessionPart[];
  completedSessions: ISession[];
}

interface GetSessionsStatisticsAggregatesOptions {
  aggregates: IDailyAggregate[];
}

interface BuildADsOptions {
  totalStat: SessionStat;
  allActivitiesStat: SessionStat;
  userActivities: IActivity[];
  activitiesStatMap: Map<string, SessionStat>;
}

interface GetADsOptions {
  totalStat: SessionStat;
  sessionParts: ISessionPart[];
  completedSessions: ISession[];
  userActivities: IActivity[];
}

interface GetADsAggregatesOptions {
  totalStat: SessionStat;
  dailyAds: IDailyAD[];
  userActivities: IActivity[];
}

interface GetBarStatAndAdsOptions {
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

interface CreateEmptyBarsOptions {
  startOfRange: Date;
  endOfRange: Date;
  barType: TimeBarType;
  timezone: string;
}

type DataSource =
  | { type: 'raw'; sessionParts: ISessionPart[]; completedSessions: ISession[] }
  | {
      type: 'aggregates';
      dailyAggregates: IDailyAggregate[];
      dailyAds: IDailyAD[];
      timezone: string;
    };

interface GetTodayAggregateOptions {
  userId: string;
  timezone: string;
}

interface CalculateStreakOptions {
  userId: string;
  timezone: string;
  dailyGoalSeconds: number;
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

interface MergeBarsOptions {
  leftObj: AnalyticsForRangeDTO;
  rightObj: AnalyticsForRangeDTO;
  finalObjEndOfRange: Date;
  timezone: string;
  dailyRangePosition: 'left' | 'right';
}

interface MergeBarsDailyRangeOnLeftOptions {
  leftObj: AnalyticsForRangeDTO;
  rightObj: AnalyticsForRangeDTO;
}

interface MergeBarsDailyRangeOnRightOptions {
  leftObj: AnalyticsForRangeDTO;
  rightObj: AnalyticsForRangeDTO;
  finalObjEndOfRange: Date;
  timezone: string;
}

interface MergeAnalyticsOptions {
  leftObj: AnalyticsForRangeDTO;
  rightObj: AnalyticsForRangeDTO;
  finalObjEndOfRange: Date;
  timezone: string;
  dailyRangePosition: 'left' | 'right';
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

interface ApplySessionDeleteToAggregatesOptions {
  userId: string;
  timezone: string;

  // event params
  deletedParts: ISessionPart[];
  activityId?: string;
  completedDate?: Date;
}

interface ApplyActivityDeleteToAggregatesOptions {
  userId: string;

  // event params
  activityId: string;
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
  createEmptyBars,
  getSessionsStatisticsAggregates,
  getActivityDistributionsAggregates,
  getTodayAggregate,
  calculateStreak,
  applySessionUpdateToAggregates,
  applySessionDeleteToAggregates,
  applyActivityDeleteToAggregates,
  getAnalyticsForRangeInternal,
  getAnalyticsForRangeAggregates,
  getAnalyticsForRangeCache,
  mergeSessionStat,
  mergeActivityDistributions,
  mergeBarsWithDailyRangeOnLeft,
  mergeBarsWithDailyRangeOnRight,
  mergeAdjacentTimeBars,
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
}: GetSessionsStatisticsOptions): SessionStat {
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
      sessionStat: stat,
    });
  }

  // set without activity to activityDistributions
  const woStat: SessionStat = {
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
      sessionStat: woStat,
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
  const activitiesStatMap = new Map<string, SessionStat>();

  const allActivitiesStat: SessionStat = {
    sessionsAmount: 0,
    spentTimeSeconds: 0,
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
  const daysInRange = Math.ceil(
    (endOfRange.getTime() - startOfRange.getTime()) / DAY_MS,
  );
  if (daysInRange === 1) {
    return 'hour';
  } else if (daysInRange <= 40) {
    return 'day';
    // TODO: 365 или 366?
  } else if (daysInRange <= 366) {
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
}: GetBarStatAndAdsOptions): {
  barStat: SessionStat;
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
      nextPeriod = dt.plus({ days: 1 }).startOf('day').toJSDate();
    }
  } else if (barType == 'month') {
    const dt = DateTime.fromJSDate(nextPeriod, { zone: timezone });
    // if date is exact start of month in user timezone
    if (dt.day === 1 && dt.hour === 0 && dt.minute === 0 && dt.second === 0) {
      nextPeriod = dt.plus({ months: 1 }).toJSDate();
    } else {
      nextPeriod = dt.plus({ months: 1 }).startOf('month').toJSDate();
    }
  } else {
    // bar type is year
    const dt = DateTime.fromJSDate(nextPeriod, { zone: timezone });
    // if date is exact start of year in user timezone
    if (
      dt.month === 1 &&
      dt.day === 1 &&
      dt.hour === 0 &&
      dt.minute === 0 &&
      dt.second === 0
    ) {
      nextPeriod = dt.plus({ years: 1 }).toJSDate();
    } else {
      nextPeriod = dt.plus({ years: 1 }).startOf('year').toJSDate();
    }
  }

  while (true) {
    let barStat: SessionStat = {
      sessionsAmount: 0,
      spentTimeSeconds: 0,
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
      sessionStat: barStat,
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
    } else {
      // bar type is year
      const nextPeriodLuxon = DateTime.fromJSDate(nextPeriod, {
        zone: timezone,
      }).plus({ years: 1 });
      nextPeriod = nextPeriodLuxon.toJSDate();
    }
  }

  return timeBars;
}

function createEmptyBars({
  startOfRange,
  endOfRange,
  timezone,
  barType,
}: CreateEmptyBarsOptions): TimeBar[] {
  return analyticsService.getTimeBars({
    startOfRange,
    endOfRange,
    barType,
    timezone,
    userActivities: [],
    dataSource: {
      type: 'raw',
      sessionParts: [],
      completedSessions: [],
    },
  });
}

function getSessionsStatisticsAggregates({
  aggregates,
}: GetSessionsStatisticsAggregatesOptions): SessionStat {
  const sessionStat: SessionStat = {
    spentTimeSeconds: 0,
    sessionsAmount: 0,
    pausedAmount: 0,
  };
  for (let i = 0; i < aggregates.length; i++) {
    const aggregate = aggregates[i];

    sessionStat.spentTimeSeconds += aggregate.spentTimeSeconds;
    sessionStat.sessionsAmount += aggregate.sessionsAmount;
    sessionStat.pausedAmount += aggregate.pausedAmount;
  }

  return sessionStat;
}

function getActivityDistributionsAggregates({
  totalStat,
  userActivities,
  dailyAds,
}: GetADsAggregatesOptions): ActivityDistribution[] {
  const activitiesStatMap = new Map<string, SessionStat>();

  const allActivitiesStat: SessionStat = {
    sessionsAmount: 0,
    spentTimeSeconds: 0,
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

async function getTodayAggregate({
  userId,
  timezone,
}: GetTodayAggregateOptions): Promise<IDailyAggregate> {
  const { startOfToday } = getTodayRange(timezone);
  const dt = DateTime.fromJSDate(startOfToday, { zone: timezone });
  const dateISO = dt.toISODate();

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

  return todayAggregate;
}

async function calculateStreak({
  userId,
  timezone,
  dailyGoalSeconds,
}: CalculateStreakOptions): Promise<number> {
  const { startOfToday } = getTodayRange(timezone);
  const todayDt = DateTime.fromJSDate(startOfToday, {
    zone: timezone,
  });

  const todayAggregate = await DailyAggregate.findOne({
    date: todayDt.toISODate(),
    user: userId,
  });
  if (!todayAggregate) {
    return 0;
  }
  if (todayAggregate.spentTimeSeconds < dailyGoalSeconds) {
    return 0;
  }

  let streak = 1;
  let prevDays: string[] = [];
  let loopDt = todayDt;

  while (true) {
    prevDays = [];
    for (let i = 0; i < 5; i++) {
      loopDt = loopDt.minus({ days: 1 });
      prevDays.push(loopDt.toISODate()!);
    }

    const prevAggrs = await DailyAggregate.find({
      user: userId,
      date: { $in: prevDays },
    });
    let streakStopped = false;
    for (let i = 0; i < 5; i++) {
      const aggr = prevAggrs.find((aggr) => aggr.date === prevDays[i]);
      if (!aggr) {
        break;
      }
      if (aggr.spentTimeSeconds < dailyGoalSeconds) {
        streakStopped = true;
        break;
      }

      streak++;
    }

    if (streakStopped || prevAggrs.length !== 5) {
      break;
    }
  }

  return streak;
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
  if (addedSpentTimeSeconds <= 0) {
    return;
  }

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

async function applySessionDeleteToAggregates({
  userId,
  timezone,
  deletedParts,
  activityId,
  completedDate,
}: ApplySessionDeleteToAggregatesOptions) {
  let completedDateISO: string | null = null;
  if (completedDate) {
    completedDateISO = DateTime.fromJSDate(completedDate, {
      zone: timezone,
    }).toISODate();

    if (!completedDateISO) {
      return;
    }
  }

  const deletedStatMap = new Map<
    string,
    { spentTimeSeconds: number; pausedAmount: number }
  >(); // dateISO / object
  for (let i = 0; i < deletedParts.length; i++) {
    const dateISO = DateTime.fromJSDate(deletedParts[i].createdDate, {
      zone: timezone,
    }).toISODate();
    if (!dateISO) {
      continue;
    }

    let dailyStat = deletedStatMap.get(dateISO);
    if (!dailyStat) {
      dailyStat = { spentTimeSeconds: 0, pausedAmount: 0 };
    }
    dailyStat.spentTimeSeconds += deletedParts[i].spentTimeSeconds;
    if (deletedParts[i].paused) {
      dailyStat.pausedAmount += 1;
    }

    deletedStatMap.set(dateISO, dailyStat);
  }

  const dates = [...deletedStatMap.keys()];
  if (dates.length === 0) {
    return;
  }

  const dailyAggregatesToUpdate = await DailyAggregate.find({
    user: userId,
    date: { $in: dates },
  });
  for (let i = 0; i < dailyAggregatesToUpdate.length; i++) {
    const aggregate = dailyAggregatesToUpdate[i];

    const statToDelete = deletedStatMap.get(aggregate.date);
    if (!statToDelete) {
      continue;
    }

    aggregate.spentTimeSeconds -= statToDelete.spentTimeSeconds;
    aggregate.pausedAmount -= statToDelete.pausedAmount;

    if (completedDateISO && aggregate.date === completedDateISO) {
      aggregate.sessionsAmount -= 1;
    }
  }

  await DailyAggregate.bulkSave(dailyAggregatesToUpdate);

  if (!activityId) {
    return;
  }

  const dailyAdsToUpdate = await DailyActivityDistribution.find({
    user: userId,
    date: { $in: dates },
    activity: activityId,
  });
  const dailyAdsToDelete = [];
  for (let i = 0; i < dailyAdsToUpdate.length; i++) {
    const dailyAd = dailyAdsToUpdate[i];

    const statToDelete = deletedStatMap.get(dailyAd.date);
    if (!statToDelete) {
      continue;
    }

    dailyAd.spentTimeSeconds -= statToDelete.spentTimeSeconds;
    dailyAd.pausedAmount -= statToDelete.pausedAmount;

    if (completedDateISO && dailyAd.date === completedDateISO) {
      dailyAd.sessionsAmount -= 1;
    }

    if (dailyAd.spentTimeSeconds === 0) {
      dailyAdsToDelete.push(dailyAd);
    }
  }

  await DailyActivityDistribution.bulkSave(dailyAdsToUpdate);
  if (dailyAdsToDelete.length > 0) {
    const ids = dailyAdsToDelete.map((ad) => ad._id);
    await DailyActivityDistribution.deleteMany({ _id: { $in: ids } });
  }
}

async function applyActivityDeleteToAggregates({
  userId,
  activityId,
}: ApplyActivityDeleteToAggregatesOptions) {
  const dailyAdsToDelete = await DailyActivityDistribution.find({
    activity: activityId,
    user: userId,
  });

  const dailyAdsMap = new Map<string, SessionStat>();
  for (let i = 0; i < dailyAdsToDelete.length; i++) {
    const ad = dailyAdsToDelete[i];

    dailyAdsMap.set(ad.date, {
      spentTimeSeconds: ad.spentTimeSeconds,
      sessionsAmount: ad.sessionsAmount,
      pausedAmount: ad.pausedAmount,
    });
  }

  const dates = [...dailyAdsMap.keys()];
  const dailyAggrsToUpdate = await DailyAggregate.find({
    user: userId,
    date: { $in: dates },
  });
  for (let i = 0; i < dailyAggrsToUpdate.length; i++) {
    const aggr = dailyAggrsToUpdate[i];

    const adStat = dailyAdsMap.get(aggr.date);
    if (!adStat) {
      continue;
    }

    aggr.sessionsAmount -= adStat.sessionsAmount;
    aggr.spentTimeSeconds -= adStat.spentTimeSeconds;
    aggr.pausedAmount -= adStat.pausedAmount;
  }

  await DailyAggregate.bulkSave(dailyAggrsToUpdate);

  const ids = dailyAdsToDelete.map((ad) => ad._id);
  await DailyActivityDistribution.deleteMany({ _id: { $in: ids } });
}

async function getAnalyticsForRangeInternal({
  startOfRange,
  endOfRange,
  userId,
  timezone,
}: GetAnalyticsForRangeOptions): Promise<AnalyticsForRangeDTO> {
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

  const sessionStat = analyticsService.getSessionsStatistics({
    sessionParts: sessionPartsForRange,
    completedSessions: completedSessionsForRange,
  });

  const userActivities = await activityService.getActivities({ userId });

  const activityDistribution = analyticsService.getActivityDistributions({
    totalStat: sessionStat,
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
    startOfRange,
    endOfRange,
    sessionStat,
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

    const sessionStat = analyticsService.getSessionsStatisticsAggregates({
      aggregates: dailyAggregates,
    });

    const userActivities = await activityService.getActivities({ userId });
    const ads = analyticsService.getActivityDistributionsAggregates({
      totalStat: sessionStat,
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
      startOfRange: startOfRangeAggrDate,
      endOfRange: endOfRangeAggrDate,
      sessionStat,
      activityDistribution: ads,
      timeBars,
    };

    if (leadingAnalytics) {
      aggrAnalytics = analyticsService.mergeAnalytics({
        finalObjEndOfRange: endOfRangeAggrDate,
        leftObj: leadingAnalytics,
        rightObj: aggrAnalytics,
        timezone,
        dailyRangePosition: 'left',
      });
    }

    if (trailingAnalytics) {
      aggrAnalytics = analyticsService.mergeAnalytics({
        finalObjEndOfRange: endOfRange,
        leftObj: aggrAnalytics,
        rightObj: trailingAnalytics,
        timezone,
        dailyRangePosition: 'right',
      });
    }

    return aggrAnalytics;
  } catch (e) {
    throw e;
  }
}

async function getAnalyticsForRangeCache({
  startOfRange,
  endOfRange,
  userId,
  timezone,
}: GetAnalyticsForRangeOptions): Promise<AnalyticsForRangeDTO> {
  try {
    if (startOfRange > new Date()) {
      return {
        startOfRange,
        endOfRange,
        sessionStat: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
        timeBars: [],
      };
    }

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
      // TODO: даже при вызове getAnalyticsForRangeAggregates все равно будет вызываться внутри getAnalyticsForRangeInternal, из-за того, что период меньше дня.
      // Хотя было бы неплохо брать инфу сегодняшнего дня из сегодняшнего агрегата
      // Но это мы сможем сделать только в том случае, если startOfRange - это ровно startOfToday, и endOfRange позже сейчашнего момента,
      // вот тогда точно можно обратиться к агрегату сегодняшнего дня
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
        const analyticsUntilToday: AnalyticsForRangeDTO = JSON.parse(
          cacheValue,
          (key, value) => {
            if (key === 'startOfRange' || key === 'endOfRange') {
              return new Date(value);
            }
            return value;
          },
        );

        return analyticsService.mergeAnalytics({
          finalObjEndOfRange: endOfRange,
          leftObj: analyticsUntilToday,
          rightObj: analyticsForToday,
          timezone,
          dailyRangePosition: 'right',
        });
      }

      const analyticsUntilToday =
        await analyticsService.getAnalyticsForRangeAggregates({
          startOfRange,
          endOfRange: startOfToday,
          userId,
          timezone,
        });

      if (analyticsUntilToday.sessionStat.spentTimeSeconds > 0) {
        await redisClient.set(cacheKey, JSON.stringify(analyticsUntilToday), {
          expiration: {
            type: 'EXAT',
            value: Math.trunc(startOfTomorrow.getTime() / 1000),
          }, // start of tomorrow (unix timestamp)
        });
      }

      return analyticsService.mergeAnalytics({
        finalObjEndOfRange: endOfRange,
        leftObj: analyticsUntilToday,
        rightObj: analyticsForToday,
        timezone,
        dailyRangePosition: 'right',
      });
    } else {
      const cacheKey = `analytics:${userId}:${startOfRange.toISOString()}:${endOfRange.toISOString()}`;

      const cacheValue = await redisClient.get(cacheKey);
      if (cacheValue) {
        return JSON.parse(cacheValue) as AnalyticsForRangeDTO;
      }

      const analyticsForRange =
        await analyticsService.getAnalyticsForRangeAggregates({
          startOfRange,
          endOfRange,
          userId,
          timezone,
        });

      if (analyticsForRange.sessionStat.spentTimeSeconds > 0) {
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

function mergeSessionStat(statisticsList: SessionStat[]): SessionStat {
  const mergedStat: SessionStat = {
    sessionsAmount: 0,
    spentTimeSeconds: 0,
    pausedAmount: 0,
  };

  statisticsList.forEach((stat) => {
    mergedStat.sessionsAmount += stat.sessionsAmount;
    mergedStat.spentTimeSeconds += stat.spentTimeSeconds;
    mergedStat.pausedAmount += stat.pausedAmount;
  });

  return mergedStat;
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
          const { id: activityId, sessionStat } = adsList[i][j];
          adsList[i] = adsList[i].filter((ad) => ad.id !== activityId);

          return {
            id: ad.id,
            name: ad.name,
            color: ad.color,
            sessionStat: analyticsService.mergeSessionStat([
              ad.sessionStat,
              sessionStat,
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

function mergeBarsWithDailyRangeOnLeft({
  leftObj,
  rightObj,
}: MergeBarsDailyRangeOnLeftOptions): TimeBar[] {
  if (
    analyticsService.getTimeBarType(
      leftObj.startOfRange,
      leftObj.endOfRange,
    ) !== 'hour'
  ) {
    throw new Error('Left object must be day or shorter range');
  }

  const finalObjBarType = analyticsService.getTimeBarType(
    leftObj.startOfRange,
    rightObj.endOfRange,
  );
  if (finalObjBarType === 'hour') {
    return [...leftObj.timeBars, ...rightObj.timeBars];
  }

  const rightObjBarType = analyticsService.getTimeBarType(
    rightObj.startOfRange,
    rightObj.endOfRange,
  );
  let finalTimeBars: TimeBar[] = [];

  if (finalObjBarType === 'day') {
    const leftBar: TimeBar = {
      startOfRange: leftObj.startOfRange,
      endOfRange: rightObj.startOfRange,
      sessionStat: leftObj.sessionStat,
      activityDistribution: leftObj.activityDistribution,
    };

    if (rightObjBarType === 'hour') {
      const rightBar: TimeBar = {
        startOfRange: rightObj.startOfRange,
        endOfRange: rightObj.endOfRange,
        sessionStat: rightObj.sessionStat,
        activityDistribution: rightObj.activityDistribution,
      };

      finalTimeBars = [leftBar, rightBar];
    } else {
      finalTimeBars = [leftBar, ...rightObj.timeBars];
    }
  } else if (finalObjBarType === 'month' || finalObjBarType === 'year') {
    // TODO: логика для случая, когда левый объект оканчивается в начале следующего месяца/года. В таком случае Надо просто сделать также как и сверху
    // Но это вовсе не критично
    finalTimeBars = rightObj.timeBars;

    const mergedStat = analyticsService.mergeSessionStat([
      leftObj.sessionStat,
      finalTimeBars[0].sessionStat,
    ]);
    const mergedAds = analyticsService.mergeActivityDistributions({
      adsList: [
        leftObj.activityDistribution,
        finalTimeBars[0].activityDistribution,
      ],
    });

    finalTimeBars[0].startOfRange = leftObj.startOfRange;
    finalTimeBars[0].sessionStat = mergedStat;
    finalTimeBars[0].activityDistribution = mergedAds;
  }

  return finalTimeBars;
}

function mergeBarsWithDailyRangeOnRight({
  leftObj,
  rightObj,
  timezone,
  finalObjEndOfRange,
}: MergeBarsDailyRangeOnRightOptions): TimeBar[] {
  if (
    analyticsService.getTimeBarType(
      rightObj.startOfRange,
      rightObj.endOfRange,
    ) !== 'hour'
  ) {
    throw new Error('Right object must be day or shorter range');
  }

  const finalObjBarType = analyticsService.getTimeBarType(
    leftObj.startOfRange,
    finalObjEndOfRange,
  );
  if (finalObjBarType === 'hour') {
    return [...leftObj.timeBars, ...rightObj.timeBars];
  }

  const leftObjBarType = analyticsService.getTimeBarType(
    leftObj.startOfRange,
    leftObj.endOfRange,
  );
  let finalTimeBars: TimeBar[] = [];

  if (finalObjBarType === 'day') {
    // making left obj bars
    if (leftObjBarType === 'hour') {
      const leftBar: TimeBar = {
        startOfRange: leftObj.startOfRange,
        endOfRange: leftObj.endOfRange,
        sessionStat: leftObj.sessionStat,
        activityDistribution: leftObj.activityDistribution,
      };

      finalTimeBars = [leftBar];
    } else {
      finalTimeBars = [...leftObj.timeBars];
    }

    // making right obj bar
    const rightObjBar: TimeBar = {
      startOfRange: rightObj.startOfRange,
      endOfRange: rightObj.endOfRange,
      sessionStat: rightObj.sessionStat,
      activityDistribution: rightObj.activityDistribution,
    };
    finalTimeBars.push(rightObjBar);

    // making empty bars
    if (finalObjEndOfRange > rightObj.endOfRange) {
      const emptyBars = analyticsService.createEmptyBars({
        startOfRange: rightObj.endOfRange,
        endOfRange: finalObjEndOfRange,
        barType: 'day',
        timezone,
      });
      finalTimeBars.push(...emptyBars);
    }
  } else if (finalObjBarType === 'month') {
    const startOfNextMonth = DateTime.fromJSDate(rightObj.startOfRange, {
      zone: timezone,
    })
      .plus({ months: 1 })
      .startOf('month')
      .toJSDate();

    if (leftObjBarType === 'hour' || leftObjBarType === 'day') {
      // TODO: что делать, если leftObj (какие-то часы или какие-то дни) относится не к тому же месяцу, что и rightObj?

      const monthBar: TimeBar = {
        startOfRange: leftObj.startOfRange,
        endOfRange: new Date(),
        sessionStat: analyticsService.mergeSessionStat([
          leftObj.sessionStat,
          rightObj.sessionStat,
        ]),
        activityDistribution: analyticsService.mergeActivityDistributions({
          adsList: [
            leftObj.activityDistribution,
            rightObj.activityDistribution,
          ],
        }),
      };

      // TODO: тест для этого. Такое вообще может произойти? Если нет, то удалить условие
      if (finalObjEndOfRange.getTime() === rightObj.endOfRange.getTime()) {
        monthBar.endOfRange = rightObj.endOfRange;
        return [monthBar];
      }

      // TODO: не должны ли тут еще быть сравнения finalObjEndOfRange с startOfNextMonth, или такого не может быть когда слева только часы/дни?
      monthBar.endOfRange = startOfNextMonth;
      finalTimeBars = [monthBar];
    } else if (leftObjBarType === 'month') {
      finalTimeBars = [...leftObj.timeBars];
      let lastIdx = finalTimeBars.length - 1;

      // if right obj is first day of the next month
      const leftMonth = DateTime.fromJSDate(
        finalTimeBars[lastIdx].startOfRange,
        { zone: timezone },
      );
      const rightMonth = DateTime.fromJSDate(rightObj.startOfRange, {
        zone: timezone,
      });
      if (leftMonth.month !== rightMonth.month) {
        finalTimeBars.push({
          startOfRange: rightObj.startOfRange,
          endOfRange: rightObj.endOfRange, // it's changing lately
          sessionStat: rightObj.sessionStat,
          activityDistribution: rightObj.activityDistribution,
        });

        lastIdx += 1;
      } else {
        const mergedStat = analyticsService.mergeSessionStat([
          finalTimeBars[lastIdx].sessionStat,
          rightObj.sessionStat,
        ]);
        const mergedAds = analyticsService.mergeActivityDistributions({
          adsList: [
            finalTimeBars[lastIdx].activityDistribution,
            rightObj.activityDistribution,
          ],
        });

        finalTimeBars[lastIdx] = {
          ...finalTimeBars[lastIdx],
          sessionStat: mergedStat,
          activityDistribution: mergedAds,
        };
      }

      if (finalObjEndOfRange.getTime() === rightObj.endOfRange.getTime()) {
        finalTimeBars[lastIdx].endOfRange = rightObj.endOfRange;
        return finalTimeBars;
      }
      if (finalObjEndOfRange <= startOfNextMonth) {
        finalTimeBars[lastIdx].endOfRange = finalObjEndOfRange;
        return finalTimeBars;
      }
      finalTimeBars[lastIdx].endOfRange = startOfNextMonth;
    }

    // making empty bars
    const emptyBars = analyticsService.createEmptyBars({
      startOfRange: startOfNextMonth,
      endOfRange: finalObjEndOfRange,
      barType: 'month',
      timezone,
    });
    finalTimeBars.push(...emptyBars);
  } else if (finalObjBarType === 'year') {
    finalTimeBars = [...leftObj.timeBars];
    const lastIdx = finalTimeBars.length - 1;

    const mergedStat = analyticsService.mergeSessionStat([
      finalTimeBars[lastIdx].sessionStat,
      rightObj.sessionStat,
    ]);
    const mergedAds = analyticsService.mergeActivityDistributions({
      adsList: [
        finalTimeBars[lastIdx].activityDistribution,
        rightObj.activityDistribution,
      ],
    });

    finalTimeBars[lastIdx] = {
      ...finalTimeBars[lastIdx],
      sessionStat: mergedStat,
      activityDistribution: mergedAds,
    };

    // changing endOfRange of last bar and making empty bars if needed
    const startOfNextYear = DateTime.fromJSDate(rightObj.startOfRange, {
      zone: timezone,
    })
      .plus({ years: 1 })
      .startOf('year')
      .toJSDate();

    if (finalObjEndOfRange.getTime() === rightObj.endOfRange.getTime()) {
      finalTimeBars[lastIdx].endOfRange = rightObj.endOfRange;
      return finalTimeBars;
    }
    if (finalObjEndOfRange <= startOfNextYear) {
      finalTimeBars[lastIdx].endOfRange = finalObjEndOfRange;
      return finalTimeBars;
    }
    finalTimeBars[lastIdx].endOfRange = startOfNextYear;

    const emptyBars = analyticsService.createEmptyBars({
      startOfRange: startOfNextYear,
      endOfRange: finalObjEndOfRange,
      barType: 'year',
      timezone,
    });
    finalTimeBars.push(...emptyBars);
  }

  return finalTimeBars;
}

function mergeAdjacentTimeBars({
  leftObj,
  rightObj,
  finalObjEndOfRange,
  timezone,
  dailyRangePosition,
}: MergeBarsOptions): TimeBar[] {
  const leftObjBarType = analyticsService.getTimeBarType(
    leftObj.startOfRange,
    leftObj.endOfRange,
  );
  const rightObjBarType = analyticsService.getTimeBarType(
    rightObj.startOfRange,
    rightObj.endOfRange,
  );
  if (leftObjBarType !== 'hour' && rightObjBarType !== 'hour') {
    throw new Error(
      'Either left or right analytics object must be a day or shorter range',
    );
  }

  if (dailyRangePosition === 'left') {
    return analyticsService.mergeBarsWithDailyRangeOnLeft({
      leftObj,
      rightObj,
    });
  }
  if (dailyRangePosition === 'right') {
    return analyticsService.mergeBarsWithDailyRangeOnRight({
      leftObj,
      rightObj,
      timezone,
      finalObjEndOfRange,
    });
  }

  return [];
}

function mergeAnalytics({
  leftObj,
  rightObj,
  finalObjEndOfRange,
  timezone,
  dailyRangePosition,
}: MergeAnalyticsOptions): AnalyticsForRangeDTO {
  const finalObj: AnalyticsForRangeDTO = {
    startOfRange: leftObj.startOfRange,
    endOfRange: finalObjEndOfRange,
    sessionStat: {
      sessionsAmount: 0,
      spentTimeSeconds: 0,
      pausedAmount: 0,
    },
    activityDistribution: [],
    timeBars: [],
  };

  finalObj.sessionStat = analyticsService.mergeSessionStat([
    leftObj.sessionStat,
    rightObj.sessionStat,
  ]);
  finalObj.activityDistribution = analyticsService.mergeActivityDistributions({
    adsList: [leftObj.activityDistribution, rightObj.activityDistribution],
  });
  finalObj.timeBars = analyticsService.mergeAdjacentTimeBars({
    leftObj,
    rightObj,
    finalObjEndOfRange,
    timezone,
    dailyRangePosition,
  });

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
    sessionStat: SessionStat;
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
    deletedAd.sessionStat;
  analyticsObject.sessionStat.spentTimeSeconds -= spentTimeSeconds;
  analyticsObject.sessionStat.sessionsAmount -= sessionsAmount;
  analyticsObject.sessionStat.pausedAmount -= pausedAmount;

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
