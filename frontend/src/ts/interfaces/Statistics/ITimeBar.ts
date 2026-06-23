import { IActivityDistribution } from './IActivityDistribution';
import { ISessionStat } from './ISessionStat';

export interface ITimeBar {
  startOfRange: Date;
  endOfRange: Date;
  barName: string;
  barDetailedName: string;
  sessionStat: ISessionStat;
  adItems: IActivityDistribution[];
}
