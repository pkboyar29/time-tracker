import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../axios';
import { mapSessionFromResponse } from '../../utils/mappingHelpers';
import { ISession } from '../../ts/interfaces/Session/ISession';
import { ISessionCreate } from '../../ts/interfaces/Session/ISessionCreate';

interface SessionState {
  uncompletedSessions: ISession[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  currentSession: ISession | null;
}

const initialState: SessionState = {
  uncompletedSessions: [],
  status: 'idle',
  currentSession: null,
};

const findSessionById = (sessions: ISession[], id: string): ISession | null => {
  return sessions.find((session: ISession) => session.id === id) || null;
};

export const fetchSessions = createAsyncThunk(
  'sessions/fetchSessions',
  async () => {
    const { data: unmappedData } = await axiosInstance.get('/sessions', {
      params: {
        completed: false,
      },
    });
    const mappedData = unmappedData.map((unmappedSession: any) =>
      mapSessionFromResponse(unmappedSession)
    );
    return mappedData;
  }
);

export const createSession = createAsyncThunk(
  'sessions/createSession',
  async (newSessionData: ISessionCreate) => {
    const { data: unmappedData } = await axiosInstance.post(
      '/sessions',
      newSessionData
    );
    return mapSessionFromResponse(unmappedData);
  }
);

export const updateSession = createAsyncThunk(
  'sessions/updateSession',
  async (existingSessionData: ISession) => {
    const { data: unmappedData } = await axiosInstance.put(
      `/sessions/${existingSessionData.id}`,
      existingSessionData
    );
    return mapSessionFromResponse(unmappedData);
  }
);

export const deleteSession = createAsyncThunk(
  'sessions/deleteSession',
  async (sessionId: string) => {
    let { data } = await axiosInstance.delete(`/sessions/${sessionId}`);
    return data;
  }
);

const saveSessionToLocalStorage = (session: ISession) => {
  const sessionJson = JSON.stringify(session);
  window.localStorage.setItem('session', sessionJson);
};

const removeSessionFromLocalStorage = () => {
  if (window.localStorage.getItem('session')) {
    window.localStorage.removeItem('session');
  }
};

const sessionSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    setCurrentSession(state, action: PayloadAction<string>) {
      const currentSession: ISession | null = findSessionById(
        state.uncompletedSessions,
        action.payload
      );
      if (currentSession) {
        state.currentSession = currentSession;
        saveSessionToLocalStorage(currentSession);
      }
    },
    removeCurrentSession(state) {
      state.currentSession = null;
      removeSessionFromLocalStorage();
    },
    addSecond(state) {
      if (state.currentSession) {
        state.currentSession.spentTimeSeconds++;
      }
    },
    loadSessionFromLocalStorage(state) {
      const sessionJson = window.localStorage.getItem('session');
      if (sessionJson) {
        const session = JSON.parse(sessionJson);
        // TODO обработать ошибку когда в session хранится не сессия в формате json, а непонятно что
        // да и вообще надо попытаться запретить изменение local storage, но по-моему это невозможно
        // в любом случае, если десериализовать не получится, то очистить полностью local storage и в консоль можно вывести сообщение
        state.currentSession = session;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.uncompletedSessions = action.payload;
      })
      .addCase(fetchSessions.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.uncompletedSessions.push(action.payload);
        const currentSession: ISession | null = findSessionById(
          state.uncompletedSessions,
          action.payload.id
        );

        if (currentSession) {
          state.currentSession = currentSession;
          saveSessionToLocalStorage(currentSession);
        }
      })
      .addCase(updateSession.fulfilled, (state, action) => {
        if (state.currentSession) {
          saveSessionToLocalStorage(state.currentSession);
        }
        if (action.payload.completed) {
          state.uncompletedSessions = state.uncompletedSessions.filter(
            (session) => session.id !== action.payload.id
          );
        } else {
          state.uncompletedSessions = state.uncompletedSessions.map(
            (session) => {
              if (session.id === action.payload.id) {
                return {
                  ...session,
                  totalTimeSeconds: action.payload.totalTimeSeconds,
                  spentTimeSeconds: action.payload.spentTimeSeconds,
                  completed: action.payload.completed,
                };
              } else {
                return session;
              }
            }
          );
        }
      })
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.uncompletedSessions = state.uncompletedSessions.filter(
          (session: ISession) => session.id !== action.meta.arg
        );

        const currentSessionJson = window.localStorage.getItem('session');
        if (currentSessionJson) {
          const currentSession: ISession = JSON.parse(currentSessionJson);
          if (currentSession.id === action.meta.arg) {
            removeSessionFromLocalStorage();
          }
        }
      });
  },
});

export const {
  setCurrentSession,
  removeCurrentSession,
  addSecond,
  loadSessionFromLocalStorage,
} = sessionSlice.actions;
export default sessionSlice.reducer;
