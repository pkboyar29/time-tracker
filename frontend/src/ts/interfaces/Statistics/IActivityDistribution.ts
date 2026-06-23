import { ISessionStat } from './ISessionStat';

export interface IActivityDistribution {
  id: string;
  name: string;
  fill: string;
  sessionStat: ISessionStat;
  spentTimePercentage: number;
}
