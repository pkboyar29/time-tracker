export interface IActivity {
  id: string;
  name: string;
  descr?: string;
  sessionsAmount: number;
  spentTimeSeconds: number;
  activityGroup: {
    id: string;
    name: string;
  };
}

export interface IActivityCreate {
  name: string;
  descr?: string;
  activityGroupId: string;
}

export interface IActivityUpdate {
  id: string;
  name: string;
  descr?: string;
}
