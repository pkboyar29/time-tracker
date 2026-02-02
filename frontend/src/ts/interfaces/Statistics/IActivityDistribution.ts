import { ISessionStatistics } from './ISessionStatistics';

export interface IActivityDistribution {
  id: string;
  name: string;
  fill: string;
  sessionStatistics: ISessionStatistics;
  spentTimePercentage: number;
}
