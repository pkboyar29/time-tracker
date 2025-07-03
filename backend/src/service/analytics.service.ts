import sessionService from '../service/session.service';
import sessionPartService from './sessionPart.service';
import activityService from './activity.service';
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

      let activityDistributions: ActivityDistribution[] = [];
      const activities = await activityService.getActivities(userId);
      if (activities && activities.length !== 0) {
        activityDistributions = activities
          .filter((activity) => activity && activity.name)
          .map((activity) => {
            const activityDistribution: ActivityDistribution = {
              activityName: activity?.name || '',
              activityGroup: activity?.activityGroup!,
              sessionsAmount: 0,
              spentTimeSeconds: 0,
              spentTimePercentage: 0,
            };
            return activityDistribution;
          });
      }

      let activitiesSeconds: number = 0;
      let activitiesSessions: number = 0;

      // set sessionsAmount to activityDistributions
      completedSessionsForRange?.forEach((session) => {
        if (session.activity) {
          const activityDistributionIndex: number =
            activityDistributions.findIndex(
              (activityDistribution) =>
                activityDistribution.activityName === session.activity.name
            );
          activityDistributions[activityDistributionIndex].sessionsAmount += 1;

          activitiesSessions += 1;
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

          activitiesSeconds += sessionPart.spentTimeSeconds;
        }
      });

      // delete empty activity distributions
      activityDistributions = activityDistributions.filter(
        (activityDistribution) =>
          activityDistribution.sessionsAmount !== 0 ||
          activityDistribution.spentTimeSeconds !== 0
      );

      // set spentTimePercentage to activityDistributions
      activityDistributions = activityDistributions.map(
        (activityDistribution) => {
          return {
            ...activityDistribution,
            spentTimePercentage: parseFloat(
              (
                activityDistribution.spentTimeSeconds / spentTimeSeconds
              ).toFixed(2)
            ),
          };
        }
      );

      // set without activity to activityDistributions
      const woActivitySessions = sessionsAmount - activitiesSessions;
      const woActivitySeconds = spentTimeSeconds - activitiesSeconds;
      if (woActivitySeconds > 0) {
        activityDistributions.push({
          activityGroup: { _id: '0', name: 'wo' },
          activityName: 'Without activity',
          sessionsAmount: woActivitySessions,
          spentTimeSeconds: woActivitySeconds,
          spentTimePercentage: woActivitySeconds / spentTimeSeconds,
        });
      }

      return {
        sessionsAmount,
        spentTimeSeconds,
        activityDistribution: activityDistributions,
      };
    } catch (e) {
      this.handleError(e);
    }
  },

  handleError(e: unknown) {
    if (e instanceof Error) {
      throw new Error(e.message);
    }
  },
};
