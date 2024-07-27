import { ISessionActivity } from './ISessionActivity';

export interface ISession {
  id: string;
  totalTimeSeconds: number;
  spentTimeSeconds: number;
  activity?: ISessionActivity;
  completed: boolean;
}
