import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../axios';
import { mapActivityGroupFromResponse } from '../../helpers/mappingHelpers';

import { IActivityGroup } from '../../ts/interfaces/ActivityGroup/IActivityGroup';
import { IActivityGroupCreate } from '../../ts/interfaces/ActivityGroup/IActivityGroupCreate';
import { IActivityGroupUpdate } from '../../ts/interfaces/ActivityGroup/IActivityGroupUpdate';

interface ActivityGroupState {}
const initialState: ActivityGroupState = {};

export const fetchActivityGroups = createAsyncThunk<IActivityGroup[], void>(
  'activity-groups/fetchActivityGroups',
  async () => {
    const { data: unmappedData } = await axiosInstance.get('/activity-groups');
    const mappedData: IActivityGroup[] = unmappedData.map(
      (unmappedActivityGroup: any) =>
        mapActivityGroupFromResponse(unmappedActivityGroup)
    );
    return mappedData;
  }
);

export const createActivityGroup = createAsyncThunk<
  IActivityGroup,
  IActivityGroupCreate
>(
  'activity-groups/createActivityGroup',
  async (newActivityGroupData: IActivityGroupCreate) => {
    const { data: unmappedData } = await axiosInstance.post(
      '/activity-groups',
      newActivityGroupData
    );
    const mappedActivityGroup = mapActivityGroupFromResponse(unmappedData);
    return mappedActivityGroup;
  }
);

export const updateActivityGroup = createAsyncThunk(
  'activity-groups/updateActivityGroup',
  async (activityGroupData: IActivityGroupUpdate) => {
    const { data: unmappedData } = await axiosInstance.put(
      `/activity-groups/${activityGroupData.id}`,
      activityGroupData
    );
    const mappedActivityGroup = mapActivityGroupFromResponse(unmappedData);
    return mappedActivityGroup;
  }
);

export const deleteActivityGroup = createAsyncThunk(
  'activity-groups/deleteActivityGroup',
  async (activityGroupId: string) => {
    const { data: message } = await axiosInstance.delete(
      `activity-groups/${activityGroupId}`
    );
    return message;
  }
);

const activityGroupSlice = createSlice({
  name: 'activity-groups',
  initialState,
  reducers: {},
  extraReducers: (builder) => {},
});

export default activityGroupSlice.reducer;
