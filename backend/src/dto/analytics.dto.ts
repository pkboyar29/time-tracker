export interface SessionStat {
  sessionsAmount: number;
  pausedAmount: number;
  spentTimeSeconds: number;
}
export const emptySessionStat: SessionStat = {
  sessionsAmount: 0,
  spentTimeSeconds: 0,
  pausedAmount: 0,
};

export interface ActivityDistribution {
  id: string;
  name: string;
  color: string;
  sessionStat: SessionStat;
}

export interface TimeBar {
  startOfRange: Date;
  endOfRange: Date;
  sessionStat: SessionStat;
  activityDistribution: ActivityDistribution[];
}

export interface AnalyticsForRangeDTO {
  startOfRange: Date;
  endOfRange: Date;
  sessionStat: SessionStat;
  activityDistribution: ActivityDistribution[];
  timeBars: TimeBar[];
}
