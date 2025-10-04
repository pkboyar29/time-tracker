import { IActivityDistribution } from './IActivityDistribution';

export interface ITimeBar {
  startOfRange: Date;
  endOfRange: Date;
  barName: string;
  barDetailedName: string;
  sessionsAmount: number;
  spentTimeSeconds: number;
  activityDistributionItems: IActivityDistribution[];
}
