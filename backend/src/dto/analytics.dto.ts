export interface SessionStatistics {
  sessionsAmount: number;
  pausedAmount: number;
  spentTimeSeconds: number;
}

export interface ActivityDistribution {
  activityName: string;
  activityColor: string;
  sessionStatistics: SessionStatistics;
}

export interface TimeBar {
  startOfRange: Date;
  endOfRange: Date;
  sessionStatistics: SessionStatistics;
  activityDistribution: ActivityDistribution[];
}

export interface AnalyticsForRangeDTO {
  sessionStatistics: SessionStatistics;
  activityDistribution: ActivityDistribution[];
  timeBars: TimeBar[];
}
