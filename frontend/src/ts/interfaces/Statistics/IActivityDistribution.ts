export interface IActivityDistribution {
  activityName: string;
  activityGroup: { _id: string; name: string };
  sessionsAmount: number;
  spentTimeSeconds: number;
  spentTimePercentage: number;
}
