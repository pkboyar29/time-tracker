export interface IActivity {
  id: string;
  name: string;
  descr?: string;
  archived: boolean;
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

export interface IActivityArchive {
  id: string;
  archived: boolean;
}
