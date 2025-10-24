import { ISessionStatistics } from './ISessionStatistics';
import { IActivityDistribution } from './IActivityDistribution';
import { ITimeBar } from './ITimeBar';

export interface IAnalytics {
  sessionStatistics: ISessionStatistics;
  activityDistributionItems: IActivityDistribution[];
  timeBars: ITimeBar[];
}
