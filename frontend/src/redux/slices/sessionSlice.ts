import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SessionState {
  lastCompletedSessionId: string | null;
}

const initialState: SessionState = {
  lastCompletedSessionId: null,
};

const sessionSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    setLastCompletedSessionId(state, action: PayloadAction<string>) {
      state.lastCompletedSessionId = action.payload;
    },
  },
  extraReducers: (builder) => {},
});

export const { setLastCompletedSessionId } = sessionSlice.actions;
export default sessionSlice.reducer;
