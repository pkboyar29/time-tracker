import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';
import { IUser } from '../../ts/interfaces/User/IUser';
import UserStateStatuses from '../../ts/enums/UserStateStatuses';

interface UserState {
  user: IUser | null;
  status: UserStateStatuses;
}

const initialState: UserState = {
  user: null,
  status: UserStateStatuses.idle,
};

export const fetchProfileInfo = createAsyncThunk(
  'users/fetchProfileInfo',
  async () => {
    const { data } = await axios.get('/users/profile');
    return data as IUser;
  }
);

export const updateDailyGoal = createAsyncThunk(
  'users/updateDailyGoal',
  async (newDailyGoal: number) => {
    const { data } = await axios.put('/users/updateDailyGoal', {
      newDailyGoal,
    });
    return data;
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    logOutUser(state) {
      state.user = null;
      state.status = UserStateStatuses.logout;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileInfo.pending, (state) => {
        state.status = UserStateStatuses.loading;
      })
      .addCase(fetchProfileInfo.fulfilled, (state, action) => {
        state.status = UserStateStatuses.succeeded;
        state.user = action.payload;
      })
      .addCase(fetchProfileInfo.rejected, (state) => {
        state.status = UserStateStatuses.failed;
      })
      .addCase(updateDailyGoal.fulfilled, (state, action) => {
        if (state.user) {
          state.user = {
            ...state.user,
            dailyGoal: action.meta.arg,
          };
        }
      });
  },
});

export const { logOutUser } = userSlice.actions;
export default userSlice.reducer;
