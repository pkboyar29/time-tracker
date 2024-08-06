import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../axios';
import { mapActivityFromResponse } from '../../utils/mappingHelpers';
import { IActivity } from '../../ts/interfaces/Activity/IActivity';
import { IActivityCreate } from '../../ts/interfaces/Activity/IActivityCreate';
import { IActivityUpdate } from '../../ts/interfaces/Activity/IActivityUpdate';

interface ActivityState {
  activities: IActivity[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: ActivityState = {
  activities: [],
  status: 'idle',
};

export const fetchActivities = createAsyncThunk(
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

export const createActivity = createAsyncThunk(
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
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.activities = action.payload;
      })
      .addCase(fetchActivities.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(createActivity.fulfilled, (state, action) => {
        state.activities.push(action.payload);
      })
      .addCase(updateActivity.fulfilled, (state, action) => {
        state.activities = state.activities.map((activity) => {
          if (activity.id === action.payload.id) {
            return {
              ...activity,
              name: action.payload.name,
              descr: action.payload.descr,
            };
          } else {
            return activity;
          }
        });
      })
      .addCase(deleteActivity.fulfilled, (state, action) => {
        state.activities = state.activities.filter(
          (activity) => activity.id !== action.meta.arg
        );
      });
  },
});

// export const {  } = activitySlice.actions
export default activitySlice.reducer;
