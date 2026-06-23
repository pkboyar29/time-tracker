import { ISessionStat } from './ISessionStat';
import { IActivityDistribution } from './IActivityDistribution';
import { ITimeBar } from './ITimeBar';

export interface IAnalytics {
  sessionStat: ISessionStat;
  adItems: IActivityDistribution[];
  timeBars: ITimeBar[];
}
