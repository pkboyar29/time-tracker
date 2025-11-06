import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUser } from '../../ts/interfaces/User/IUser';

interface UserState {
  user: IUser | null;
}

const initialState: UserState = {
  user: null,
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<IUser>) {
      state.user = action.payload;
    },
    logOutUser(state) {
      state.user = null;
    },
  },
  extraReducers: (builder) => {},
});

export const { logOutUser, setUser } = userSlice.actions;
export default userSlice.reducer;
