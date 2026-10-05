import { ISessionActivity } from './ISessionActivity';

export interface ISession {
  id: string;
  totalSeconds: number;
  spentSeconds: number;
  activity?: ISessionActivity;
  completed: boolean;
  note?: string;
}
