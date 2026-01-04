import { ISessionStatistics } from './ISessionStatistics';

export interface IActivityDistribution {
  activityName: string;
  fill: string;
  sessionStatistics: ISessionStatistics;
  spentTimePercentage: number;
}
