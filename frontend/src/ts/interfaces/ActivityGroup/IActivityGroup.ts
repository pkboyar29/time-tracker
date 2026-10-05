export interface IActivityGroup {
  id: string;
  name: string;
  descr?: string;
  sessionsAmount: number;
  spentSeconds: number;
}

export interface IActivityGroupCreate {
  name: string;
  descr?: string;
}

export interface IActivityGroupUpdate {
  id: string;
  name: string;
  descr?: string;
}
