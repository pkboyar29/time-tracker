export interface IActivity {
  id: string;
  name: string;
  descr?: string;
  sessionsAmount: number;
  spentTimeSeconds: number;
}
