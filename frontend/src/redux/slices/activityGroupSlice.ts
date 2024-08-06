import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../axios';
import { IActivityGroup } from '../../ts/interfaces/ActivityGroup/IActivityGroup';
import { IActivityGroupCreate } from '../../ts/interfaces/ActivityGroup/IActivityGroupCreate';
import { IActivityGroupUpdate } from '../../ts/interfaces/ActivityGroup/IActivityGroupUpdate';
import { mapActivityGroupFromResponse } from '../../utils/mappingHelpers';

interface ActivityGroupState {
  activityGroups: IActivityGroup[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: ActivityGroupState = {
  activityGroups: [],
  status: 'idle',
};

export const fetchActivityGroups = createAsyncThunk(
  'activity-groups/fetchActivityGroups',
  async () => {
    const { data: unmappedData } = await axios.get('/activity-groups');
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
    const { data: unmappedData } = await axios.post(
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
    const { data: unmappedData } = await axios.put(
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
    const { data: message } = await axios.delete(
      `activity-groups/${activityGroupId}`
    );
    return message;
  }
);

const activityGroupSlice = createSlice({
  name: 'activity-groups',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivityGroups.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchActivityGroups.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.activityGroups = action.payload;
      })
      .addCase(fetchActivityGroups.rejected, (state) => {
        state.status = 'failed';
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

export default activityGroupSlice.reducer;
