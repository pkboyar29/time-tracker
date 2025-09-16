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

const analyticsService = {
  getSessionsStatistics,
  getActivityDistributions,
  getTimeBarType,
  getTimeBars,
  getAnalyticsForRange,
};

async function getSessionsStatistics({
  sessionParts,
  completedSessions,
}: GetSessionsStatistics): Promise<{
  sessionsAmount: number;
  spentTimeSeconds: number;
}> {
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
      nextPeriod.setMonth(nextPeriod.getMonth() + 1);
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
}: GetAnalyticsForRangeOptions): Promise<AnalyticsForRangeDTO | undefined> {
  try {
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
      await analyticsService.getSessionsStatistics({
        sessionParts: sessionPartsForRange,
        completedSessions: completedSessionsForRange,
      });

    const activityDistribution =
      await analyticsService.getActivityDistributions({
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

    return {
      sessionsAmount,
      spentTimeSeconds,
      activityDistribution,
      timeBars,
    };
  } catch (e) {
    throw e;
  }
}

export default analyticsService;
