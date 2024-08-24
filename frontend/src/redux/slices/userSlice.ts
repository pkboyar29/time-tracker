import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../axios';
import { IUser } from '../../ts/interfaces/User/IUser';

interface UserState {
  user: IUser | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed' | 'logout';
}

const initialState: UserState = {
  user: null,
  status: 'idle',
};

export const fetchProfileInfo = createAsyncThunk(
  'users/fetchProfileInfo',
  async () => {
    const { data } = await axiosInstance.get('/users/profile');
    return data as IUser;
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    logOutUser(state) {
      state.user = null;
      state.status = 'logout';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileInfo.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProfileInfo.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(fetchProfileInfo.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export const { logOutUser } = userSlice.actions;
export default userSlice.reducer;
