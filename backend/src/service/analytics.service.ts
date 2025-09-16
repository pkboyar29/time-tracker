import sessionService from '../service/session.service';
import sessionPartService from './sessionPart.service';
import activityService from './activity.service';
import {
  AnalyticsForRangeDTO,
  ActivityDistribution,
  TimeBar,
} from '../dto/analytics.dto';
import { PopulatedSessionPartType } from '../model/sessionPart.model';
import { PopulatedSessionType } from '../model/session.model';

import { DateTime } from 'luxon';

type TimeBarType = 'hour' | 'day' | 'month' | 'year';

// TODO: убрать тип any
async function getActivityDistributions(
  allSessionsAmount: number,
  allSpentTimeSeconds: number,
  sessionParts: any,
  completedSessions: any,
  userId: string
): Promise<ActivityDistribution[]> {
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
  completedSessions?.forEach((session: PopulatedSessionType) => {
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
  sessionParts?.forEach((sessionPart: PopulatedSessionPartType) => {
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

// TODO: убрать тип any
function getTimeBars(
  startOfRange: Date,
  endOfRange: Date,
  sessionParts: any,
  completedSessions: any,
  barType: TimeBarType,
  timezone: string
): TimeBar[] {
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
    const filteredSessionParts = sessionParts?.filter(
      (sessionPart: PopulatedSessionPartType) => {
        const createdDate = sessionPart.createdDate.getTime();

        return (
          createdDate >= prevPeriod.getTime() &&
          createdDate < nextPeriod.getTime()
        );
      }
    );
    const filteredSessions = completedSessions?.filter(
      (session: PopulatedSessionType) => {
        const completedDate = session.updatedDate.getTime();

        return (
          completedDate >= prevPeriod.getTime() &&
          completedDate < nextPeriod.getTime()
        );
      }
    );

    const barSpentTimeSeconds = filteredSessionParts
      ? filteredSessionParts.reduce(
          (total: number, sessionPart: PopulatedSessionPartType) =>
            total + sessionPart.spentTimeSeconds,
          0
        )
      : 0;
    const barSessionsAmount = filteredSessions
      ? filteredSessions.reduce((total: number) => total + 1, 0)
      : 0;

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

async function getAnalyticsForRange(
  startOfRange: Date,
  endOfRange: Date,
  userId: string,
  timezone: string
): Promise<AnalyticsForRangeDTO | undefined> {
  try {
    let spentTimeSeconds: number = 0;
    let sessionsAmount: number = 0;

    if (startOfRange > new Date()) {
      return {
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        activityDistribution: [],
        timeBars: [],
      };
    }

    const sessionPartsForRange =
      await sessionPartService.getSessionPartsInDateRange(
        startOfRange,
        endOfRange,
        userId
      );
    if (sessionPartsForRange && sessionPartsForRange.length > 0) {
      spentTimeSeconds = sessionPartsForRange.reduce(
        (spentTimeSeconds, sessionPart) =>
          spentTimeSeconds + sessionPart.spentTimeSeconds,
        0
      );
    }

    const completedSessionsForRange = await sessionService.getSessions(
      {
        updatedDate: { $gte: startOfRange, $lte: endOfRange },
        completed: true,
      },
      userId
    );
    if (completedSessionsForRange && completedSessionsForRange.length > 0) {
      sessionsAmount = completedSessionsForRange.length;
    }

    const activityDistributions = await getActivityDistributions(
      sessionsAmount,
      spentTimeSeconds,
      sessionPartsForRange,
      completedSessionsForRange,
      userId
    );

    const timeBars = getTimeBars(
      startOfRange,
      endOfRange,
      sessionPartsForRange,
      completedSessionsForRange,
      getTimeBarType(startOfRange, endOfRange),
      timezone
    );

    return {
      sessionsAmount,
      spentTimeSeconds,
      activityDistribution: activityDistributions,
      timeBars,
    };
  } catch (e) {
    throw e;
  }
}

export default {
  getActivityDistributions,
  getTimeBarType,
  getTimeBars,
  getAnalyticsForRange,
};
