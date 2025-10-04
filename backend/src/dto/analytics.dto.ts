interface ActivityDistribution {
  activityName: string;
  sessionsAmount: number;
  spentTimeSeconds: number;
}

interface TimeBar {
  startOfRange: Date;
  endOfRange: Date;
  sessionsAmount: number;
  spentTimeSeconds: number;
  activityDistribution: ActivityDistribution[];
}

interface AnalyticsForRangeDTO {
  sessionsAmount: number;
  spentTimeSeconds: number;
  activityDistribution: ActivityDistribution[];
  timeBars: TimeBar[];
}

export { AnalyticsForRangeDTO, ActivityDistribution, TimeBar };
