import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../api/axios';
import { mapSessionFromResponse } from '../../helpers/mappingHelpers';
import { ISession } from '../../ts/interfaces/Session/ISession';
import { ISessionCreate } from '../../ts/interfaces/Session/ISessionCreate';

interface SessionState {
  currentSession: ISession | null;
  completedSessionId: string | null;
}

const initialState: SessionState = {
  currentSession: null,
  completedSessionId: null,
};

export const loadCurrentSession = createAsyncThunk<ISession, string>(
  'sessions/loadCurrentSession',
  async (sessionId) => {
    const { data: unmappedData } = await axios.get(`/sessions/${sessionId}`);

    return mapSessionFromResponse(unmappedData);
  }
);

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

// TODO: тут тоже надо как-то ошибки обрабатывать?
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
    setCompletedSessionId(state, action: PayloadAction<string>) {
      state.completedSessionId = action.payload;
    },
    resetCompletedSessionId(state) {
      state.completedSessionId = null;
    },
    reset() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSession.fulfilled, (state, action) => {
        state.currentSession = action.payload;
      })
      .addCase(loadCurrentSession.fulfilled, (state, action) => {
        state.currentSession = action.payload;
      });
  },
});

export const {
  setCurrentSession,
  resetCurrentSession,
  changeSpentSeconds,
  changeNote,
  setCompletedSessionId,
  resetCompletedSessionId,
  reset: resetSessionState,
} = sessionSlice.actions;
export default sessionSlice.reducer;
