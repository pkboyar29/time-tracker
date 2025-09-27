import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../api/axios';
import { mapSessionFromResponse } from '../../helpers/mappingHelpers';
import { ISession } from '../../ts/interfaces/Session/ISession';
import { ISessionCreate } from '../../ts/interfaces/Session/ISessionCreate';

interface SessionState {
  currentSession: ISession | null;
  lastCompletedSessionId: string | null;
}

const initialState: SessionState = {
  currentSession: null,
  lastCompletedSessionId: null,
};

export const fetchSessions = createAsyncThunk<
  ISession[],
  Record<string, unknown>
>('sessions/fetchSessions', async (params) => {
  const { data: unmappedData } = await axios.get('/sessions', {
    params: {
      ...params,
    },
  });
  const mappedData: ISession[] = unmappedData.map((unmappedSession: any) =>
    mapSessionFromResponse(unmappedSession)
  );
  return mappedData;
});

export const createSession = createAsyncThunk<ISession, ISessionCreate>(
  'sessions/createSession',
  async (newSessionData) => {
    const { data: unmappedData } = await axios.post(
      '/sessions',
      newSessionData
    );
    return mapSessionFromResponse(unmappedData);
  }
);

// TODO: тут надо как-то глобально обрабатывать ошибки?
export const updateSession = createAsyncThunk<ISession, ISession>(
  'sessions/updateSession',
  async (existingSessionData) => {
    const { data: unmappedData } = await axios.put(
      `/sessions/${existingSessionData.id}`,
      existingSessionData
    );

    return mapSessionFromResponse(unmappedData);
  }
);

export const deleteSession = createAsyncThunk<string, string>(
  'sessions/deleteSession',
  async (sessionId) => {
    const { data } = await axios.delete(`/sessions/${sessionId}`);
    return data;
  }
);

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
  extraReducers: (builder) => {
    builder.addCase(createSession.fulfilled, (state, action) => {
      state.currentSession = action.payload;
    });
  },
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
