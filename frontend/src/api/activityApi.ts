import axios from './axios';

import {
  IActivity,
  IActivityCreate,
  IActivityUpdate,
} from '../ts/interfaces/Activity/IActivity';

// TODO: присваивать не только activityGroupId, но и название хранить
const mapResponseData = (unmappedActivity: any): IActivity => {
  return {
    ...unmappedActivity,
    id: unmappedActivity._id,
    activityGroup: {
      id: unmappedActivity.activityGroup._id,
      name: unmappedActivity.activityGroup.name,
    },
  };
};

export const fetchActivities = async (): Promise<{
  topActivities: IActivity[];
  remainingActivities: IActivity[];
}> => {
  const { data } = await axios.get(`/activities/`);

  return {
    topActivities: data.topActivities.map((a: any) => mapResponseData(a)),
    remainingActivities: data.remainingActivities.map((a: any) =>
      mapResponseData(a)
    ),
  };
};

// TODO: rename to fetchGroupActivities
export const fetchGroupActivities = async (
  activityGroupId: string
): Promise<IActivity[]> => {
  const searchParams = new URLSearchParams();
  searchParams.append('activityGroupId', activityGroupId);

  const { data } = await axios.get(`/activities/?${searchParams.toString()}`);

  return data.map((unmappedActivity: any) => mapResponseData(unmappedActivity));
};

export const fetchActivity = async (activityId: string): Promise<IActivity> => {
  const { data } = await axios.get(`/activities/${activityId}`);

  return mapResponseData(data);
};

export const createActivity = async (
  payload: IActivityCreate
): Promise<IActivity> => {
  const { data } = await axios.post('/activities', payload);

  return mapResponseData(data);
};

export const updateActivity = async (
  payload: IActivityUpdate
): Promise<IActivity> => {
  const { data } = await axios.put(`/activities/${payload.id}`, payload);

  return mapResponseData(data);
};

export const deleteActivity = async (activityId: string): Promise<string> => {
  const { data } = await axios.delete(`/activities/${activityId}`);

  return data;
};
