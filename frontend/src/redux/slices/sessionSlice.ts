import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../axios';
import { mapSessionFromResponse } from '../../helpers/mappingHelpers';
import { ISession } from '../../ts/interfaces/Session/ISession';
import { ISessionCreate } from '../../ts/interfaces/Session/ISessionCreate';
import StateStatuses from '../../ts/enums/StateStatuses';
import * as localStorageHelpers from '../../helpers/localstorageHelpers';

interface SessionState {
  currentSession: ISession | null;
  status: StateStatuses;
  completedSessionId: string | null;
}

const initialState: SessionState = {
  currentSession: null,
  status: StateStatuses.idle,
  completedSessionId: null,
};

export const fetchSessions = createAsyncThunk<
  ISession[],
  Record<string, unknown>
>('sessions/fetchSessions', async (params) => {
  const { data: unmappedData } = await axiosInstance.get('/sessions', {
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
    const { data: unmappedData } = await axiosInstance.post(
      '/sessions',
      newSessionData
    );
    return mapSessionFromResponse(unmappedData);
  }
);

export const updateSession = createAsyncThunk<ISession, ISession>(
  'sessions/updateSession',
  async (existingSessionData) => {
    const { data: unmappedData } = await axiosInstance.put(
      `/sessions/${existingSessionData.id}`,
      existingSessionData
    );
    return mapSessionFromResponse(unmappedData);
  }
);

export const deleteSession = createAsyncThunk<string, string>(
  'sessions/deleteSession',
  async (sessionId) => {
    const { data } = await axiosInstance.delete(`/sessions/${sessionId}`);
    return data;
  }
);

const sessionSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    setCurrentSession(state, action: PayloadAction<ISession>) {
      state.currentSession = action.payload;
      // TODO: убрать отсюда
      localStorageHelpers.saveSessionToLocalStorage(action.payload);
    },
    changeSpentSeconds(state, action: PayloadAction<number>) {
      if (state.currentSession) {
        state.currentSession.spentTimeSeconds = action.payload;
      }
    },
    updateCurrentSessionNote(state, action: PayloadAction<string>) {
      if (state.currentSession) {
        state.currentSession.note = action.payload;
      }
    },
    loadCurrentSession(state) {
      // TODO: брать извне и передавать сюда
      const session = localStorageHelpers.loadSessionFromLocalStorage();
      if (session) {
        state.currentSession = session;
      }
    },
    resetCurrentSession(state) {
      // TODO: делать это в другом месте?
      localStorageHelpers.removeSessionFromLocalStorage();
      state.currentSession = null;
    },
    setCompletedSessionId(state, action: PayloadAction<string>) {
      state.completedSessionId = action.payload;
    },
    resetCompletedSessionId(state) {
      state.completedSessionId = null;
    },
    reset() {
      localStorageHelpers.removeSessionFromLocalStorage();
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSession.fulfilled, (state, action) => {
        state.currentSession = action.payload;
        // TODO: делать это в другом месте?
        localStorageHelpers.saveSessionToLocalStorage(action.payload);
      })
      .addCase(updateSession.fulfilled, (state, action) => {
        if (state.currentSession) {
          // делать это в другом месте?
          localStorageHelpers.saveSessionToLocalStorage(action.payload);
        }
      });
  },
});

export const {
  setCurrentSession,
  changeSpentSeconds,
  updateCurrentSessionNote,
  loadCurrentSession,
  resetCurrentSession,
  setCompletedSessionId,
  resetCompletedSessionId,
  reset: resetSessionState,
} = sessionSlice.actions;
export default sessionSlice.reducer;
