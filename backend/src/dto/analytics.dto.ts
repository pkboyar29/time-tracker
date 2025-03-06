interface ActivityDistribution {
  activityName: string;
  sessionsAmount: number;
  spentTimeSeconds: number;
  spentTimePercentage: number;
}

interface AnalyticsForRangeDTO {
  sessionsAmount: number;
  spentTimeSeconds: number;
  activityDistribution: ActivityDistribution[];
}

export { AnalyticsForRangeDTO, ActivityDistribution };
