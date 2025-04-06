import sessionService from '../service/session.service';
import sessionPartService from './sessionPart.service';
import activityService from './activity.service';
import { endOfDay, startOfDay, startOfMonth, endOfMonth } from 'date-fns';
import {
  AnalyticsForRangeDTO,
  ActivityDistribution,
} from '../dto/analytics.dto';

export default {
  async getAnalyticsForRange(
    startOfRange: Date,
    endOfRange: Date,
    userId: string
  ): Promise<AnalyticsForRangeDTO | undefined> {
    try {
      let spentTimeSeconds: number = 0;
      let sessionsAmount: number = 0;

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

      // activity distribution
      let activityDistributions: ActivityDistribution[] = [];

      const activities = await activityService.getActivities(userId);
      if (activities && activities.length !== 0) {
        activityDistributions = activities
          .filter((activity) => activity && activity.name)
          .map((activity) => {
            const activityDistribution: ActivityDistribution = {
              activityName: activity?.name || '',
              sessionsAmount: 0,
              spentTimeSeconds: 0,
              spentTimePercentage: 0,
            };
            return activityDistribution;
          });
      }

      // set sessionsAmount to activityDistributions
      completedSessionsForRange?.forEach((session) => {
        if (session.activity) {
          const activityDistributionIndex: number =
            activityDistributions.findIndex(
              (activityDistribution) =>
                activityDistribution.activityName === session.activity.name
            );
          activityDistributions[activityDistributionIndex].sessionsAmount += 1;
        }
      });

      // set spentTimeSeconds to activityDistributions
      sessionPartsForRange?.forEach((sessionPart) => {
        if (sessionPart.session.activity) {
          const activityDistributionIndex: number =
            activityDistributions.findIndex(
              (activityDistribution) =>
                activityDistribution.activityName ===
                sessionPart.session.activity.name
            );
          activityDistributions[activityDistributionIndex].spentTimeSeconds +=
            sessionPart.spentTimeSeconds;
        }
      });

      // delete empty activity distributions
      activityDistributions = activityDistributions.filter(
        (activityDistribution) =>
          activityDistribution.sessionsAmount !== 0 ||
          activityDistribution.spentTimeSeconds !== 0
      );

      // set spentTimePercentage to activityDistributions
      const allSpentTimeSeconds: number = activityDistributions.reduce(
        (spentTimeSeconds, activityDistribution) =>
          spentTimeSeconds + activityDistribution.spentTimeSeconds,
        0
      );
      activityDistributions = activityDistributions.map(
        (activityDistribution) => {
          return {
            ...activityDistribution,
            spentTimePercentage: parseFloat(
              (
                activityDistribution.spentTimeSeconds / allSpentTimeSeconds
              ).toFixed(2)
            ),
          };
        }
      );

      return {
        sessionsAmount,
        spentTimeSeconds,
        activityDistribution: activityDistributions,
      };
    } catch (e) {
      this.handleError(e);
    }
  },

  async getAnalyticsForDay(
    dateWithDay: Date,
    userId: string
  ): Promise<AnalyticsForRangeDTO | undefined> {
    const startDay: Date = startOfDay(dateWithDay);
    const endDay: Date = endOfDay(dateWithDay);

    return this.getAnalyticsForRange(startDay, endDay, userId);
  },

  async getAnalyticsForMonth(
    dateWithMonth: Date,
    userId: string
  ): Promise<AnalyticsForRangeDTO | undefined> {
    const startMonth: Date = startOfMonth(dateWithMonth);
    const endMonth: Date = endOfMonth(dateWithMonth);
    return this.getAnalyticsForRange(startMonth, endMonth, userId);
  },

  async getAnalyticsForYear(
    year: number,
    userId: string
  ): Promise<AnalyticsForRangeDTO | undefined> {
    const startYear: Date = new Date(`${year}-01-01`);
    const endYear: Date = new Date(`${year}-12-31`);
    return this.getAnalyticsForRange(startYear, endYear, userId);
  },

  async getOverallAnalytics(
    userId: string
  ): Promise<AnalyticsForRangeDTO | undefined> {
    const startRange: Date = new Date('2000-01-01T00:00:00');
    const endRange: Date = new Date(Date.now());
    return this.getAnalyticsForRange(startRange, endRange, userId);
  },

  handleError(e: unknown) {
    if (e instanceof Error) {
      throw new Error(e.message);
    }
  },
};
