import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ISession } from '../../ts/interfaces/Session/ISession';

interface SessionState {
  currentSession: ISession | null;
  lastCompletedSessionId: string | null;
}

const initialState: SessionState = {
  currentSession: null,
  lastCompletedSessionId: null,
};

const sessionSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    setCurrentSession(state, action: PayloadAction<ISession>) {
      state.currentSession = action.payload;
    },
    resetCurrentSession(state) {
      state.currentSession = null;
    },
    changeSpentSeconds(state, action: PayloadAction<number>) {
      if (state.currentSession) {
        state.currentSession.spentTimeSeconds = action.payload;
      }
    },
    changeNote(state, action: PayloadAction<string>) {
      if (state.currentSession) {
        state.currentSession.note = action.payload;
      }
    },
    setLastCompletedSessionId(state, action: PayloadAction<string>) {
      state.lastCompletedSessionId = action.payload;
    },
    reset() {
      return initialState;
    },
  },
  extraReducers: (builder) => {},
});

export const {
  setCurrentSession,
  resetCurrentSession,
  changeSpentSeconds,
  changeNote,
  setLastCompletedSessionId,
  reset: resetSessionState,
} = sessionSlice.actions;
export default sessionSlice.reducer;
