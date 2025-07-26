import axios from './axios';

import {
  IActivityGroup,
  IActivityGroupCreate,
  IActivityGroupUpdate,
} from '../ts/interfaces/ActivityGroup/IActivityGroup';

const mapResponseData = (unmappedActivityGroup: any): IActivityGroup => {
  return {
    ...unmappedActivityGroup,
    id: unmappedActivityGroup._id,
  };
};

export const fetchActivityGroups = async (): Promise<IActivityGroup[]> => {
  const { data } = await axios.get('/activity-groups');

  return data.map((unmappedGroup: any) => mapResponseData(unmappedGroup));
};

export const fetchActivityGroup = async (
  activityGroupId: string
): Promise<IActivityGroup> => {
  const { data } = await axios.get(`/activity-groups/${activityGroupId}`);

  return mapResponseData(data);
};

export const createActivityGroup = async (
  payload: IActivityGroupCreate
): Promise<IActivityGroup> => {
  const { data } = await axios.post('/activity-groups', payload);

  return mapResponseData(data);
};

export const updateActivityGroup = async (
  payload: IActivityGroupUpdate
): Promise<IActivityGroup> => {
  const { data } = await axios.put(`/activity-groups/${payload.id}`, payload);

  return mapResponseData(data);
};

export const deleteActivityGroup = async (
  activityGroupId: string
): Promise<string> => {
  const { data } = await axios.delete(`activity-groups/${activityGroupId}`);

  return data;
};
