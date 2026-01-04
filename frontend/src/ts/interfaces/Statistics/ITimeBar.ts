import { IActivityDistribution } from './IActivityDistribution';
import { ISessionStatistics } from './ISessionStatistics';

export interface ITimeBar {
  startOfRange: Date;
  endOfRange: Date;
  barName: string;
  barDetailedName: string;
  sessionStatistics: ISessionStatistics;
  adItems: IActivityDistribution[];
}
