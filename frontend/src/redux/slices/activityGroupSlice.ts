import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../axios';
import { IActivityGroup } from '../../ts/interfaces/ActivityGroup/IActivityGroup';
import { IActivityGroupCreate } from '../../ts/interfaces/ActivityGroup/IActivityGroupCreate';
import { IActivityGroupUpdate } from '../../ts/interfaces/ActivityGroup/IActivityGroupUpdate';
import StateStatuses from '../../ts/enums/StateStatuses';
import { mapActivityGroupFromResponse } from '../../helpers/mappingHelpers';

interface ActivityGroupState {
  activityGroups: IActivityGroup[];
  status: StateStatuses;
}

const initialState: ActivityGroupState = {
  activityGroups: [],
  status: StateStatuses.idle,
};

export const fetchActivityGroups = createAsyncThunk(
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

export const createActivityGroup = createAsyncThunk(
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
  reducers: {
    reset() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivityGroups.pending, (state) => {
        state.status = StateStatuses.loading;
      })
      .addCase(fetchActivityGroups.fulfilled, (state, action) => {
        state.status = StateStatuses.succeeded;
        state.activityGroups = action.payload;
      })
      .addCase(fetchActivityGroups.rejected, (state) => {
        state.status = StateStatuses.failed;
      })
      .addCase(createActivityGroup.fulfilled, (state, action) => {
        state.activityGroups.push(action.payload);
      })
      .addCase(updateActivityGroup.fulfilled, (state, action) => {
        state.activityGroups = state.activityGroups.map((activityGroup) => {
          if (activityGroup.id === action.payload.id) {
            return {
              ...activityGroup,
              name: action.payload.name,
              descr: action.payload.descr,
            };
          } else {
            return activityGroup;
          }
        });
      })
      .addCase(deleteActivityGroup.fulfilled, (state, action) => {
        state.activityGroups = state.activityGroups.filter(
          (activityGroup) => activityGroup.id !== action.meta.arg
        );
      });
  },
});

export const { reset: resetActivityGroupState } = activityGroupSlice.actions;
export default activityGroupSlice.reducer;
