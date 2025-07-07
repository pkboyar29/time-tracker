import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';
import { mapActivityFromResponse } from '../../helpers/mappingHelpers';

import { IActivity } from '../../ts/interfaces/Activity/IActivity';
import { IActivityCreate } from '../../ts/interfaces/Activity/IActivityCreate';
import { IActivityUpdate } from '../../ts/interfaces/Activity/IActivityUpdate';

interface ActivityState {}
const initialState: ActivityState = {};

export const fetchActivities = createAsyncThunk<IActivity[], string>(
  'activities/fetchActivities',
  async (activityGroupId: string) => {
    const { data: unmappedData } = await axios.get('/activities', {
      params: {
        activityGroupId: activityGroupId,
      },
    });
    const mappedData = unmappedData.map((unmappedActivity: any) =>
      mapActivityFromResponse(unmappedActivity)
    );
    return mappedData;
  }
);

export const createActivity = createAsyncThunk<IActivity, IActivityCreate>(
  'activities/createActivity',
  async (newActivityData: IActivityCreate) => {
    const { data: unmappedData } = await axios.post(
      '/activities',
      newActivityData
    );
    const mappedActivity = mapActivityFromResponse(unmappedData);
    return mappedActivity;
  }
);

export const updateActivity = createAsyncThunk(
  'activities/updateActivity',
  async (activityData: IActivityUpdate) => {
    const { data: unmappedData } = await axios.put(
      `/activities/${activityData.id}`,
      activityData
    );
    const mappedActivity = mapActivityFromResponse(unmappedData);
    return mappedActivity;
  }
);

export const deleteActivity = createAsyncThunk(
  'activities/deleteActivity',
  async (activityId: string) => {
    const { data: message } = await axios.delete(`/activities/${activityId}`);
    return message;
  }
);

const activitySlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {},
  extraReducers: (builder) => {},
});

export default activitySlice.reducer;
