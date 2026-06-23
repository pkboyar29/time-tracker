export interface SessionStatistics {
  sessionsAmount: number;
  pausedAmount: number;
  spentTimeSeconds: number;
}
export const emptySessionStat: SessionStatistics = {
  sessionsAmount: 0,
  spentTimeSeconds: 0,
  pausedAmount: 0,
};

export interface ActivityDistribution {
  id: string;
  name: string;
  color: string;
  sessionStatistics: SessionStatistics;
}

export interface TimeBar {
  startOfRange: Date;
  endOfRange: Date;
  sessionStatistics: SessionStatistics;
  activityDistribution: ActivityDistribution[];
}

export interface AnalyticsForRangeDTO {
  startOfRange: Date;
  endOfRange: Date;
  sessionStatistics: SessionStatistics;
  activityDistribution: ActivityDistribution[];
  timeBars: TimeBar[];
}
