import { ISessionStatistics } from './ISessionStatistics';
import { IActivityDistribution } from './IActivityDistribution';
import { ITimeBar } from './ITimeBar';

export interface IAnalytics {
  sessionStatistics: ISessionStatistics;
  adItems: IActivityDistribution[];
  timeBars: ITimeBar[];
}
