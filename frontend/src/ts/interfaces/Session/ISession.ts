import { ISessionActivity } from './ISessionActivity';

export interface ISession {
  id: string;
  totalSeconds: number;
  spentSeconds: number;
  activity?: ISessionActivity;
  completed: boolean;
  note?: string;
}

export interface ISessionLegacy {
  spentTimeSeconds?: number;
  totalTimeSeconds?: number;
  spentSeconds?: number;
  totalSeconds?: number;
}
