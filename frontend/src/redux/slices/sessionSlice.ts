import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from '../../axios'
import { mapSessionFromResponse } from '../../utils/mappingHelpers'

interface SessionState {
   sessions: ISession[],
   status: string,
   currentSession: ISession | null
}

const initialState: SessionState = {
   sessions: [],
   status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
   currentSession: null
}

const findSessionById = (sessions: ISession[], id: string): ISession | null => {
   return sessions.find((session: ISession) => session.id === id) || null
}

export const fetchSessions = createAsyncThunk(
   'sessions/fetchSessions',
   async () => {
      const { data: unmappedData } = await axios.get('/sessions')
      const mappedData = unmappedData.map((unmappedSession: any) => mapSessionFromResponse(unmappedSession))
      return mappedData
   }
)

export const createSession = createAsyncThunk(
   'sessions/createSession',
   async (newSessionData: ISessionCreate) => {
      const { data: unmappedData } = await axios.post('/sessions', newSessionData)
      console.log(unmappedData)
      return mapSessionFromResponse(unmappedData)
   }
)

export const updateSession = createAsyncThunk(
   'sessions/updateSession',
   async (existingSessionData: ISession) => {
      const { data: unmappedData } = await axios.put(`/sessions/${existingSessionData.id}`, existingSessionData)
      return mapSessionFromResponse(unmappedData)
   }
)

export const deleteSession = createAsyncThunk(
   'sessions/deleteSession',
   async (sessionId: string) => {
      let { data } = await axios.delete(`/sessions/${sessionId}`)
      return data
   }
)

const sessionSlice = createSlice({
   name: 'sessions',
   initialState,
   reducers: {
      setCurrentSessionById(state, action: PayloadAction<string>) {
         state.currentSession = findSessionById(state.sessions, action.payload)
      },
      removeCurrentSession(state) {
         state.currentSession = null
      },
      addSecond(state) {
         if (state.currentSession) {
            state.currentSession.spentTimeSeconds++
         }
      }
   },
   extraReducers: (builder) => {
      builder
         .addCase(fetchSessions.pending, (state) => {
            console.log('fetchSessions.pending')
            state.status = 'loading'
         })
         .addCase(fetchSessions.fulfilled, (state, action) => {
            state.status = 'succeeded'
            state.sessions = action.payload
         })
         .addCase(fetchSessions.rejected, (state) => {
            state.status = 'failed'
         })
         .addCase(createSession.fulfilled, (state, action) => {
            state.sessions.push(action.payload)
            state.currentSession = findSessionById(state.sessions, action.payload.id)
         })
         .addCase(updateSession.fulfilled, (state, action) => {
            state.sessions = state.sessions.map((session: ISession) => {
               if (session.id === action.payload.id) {
                  return {
                     ...session,
                     totalTimeSeconds: action.payload.totalTimeSeconds,
                     spentTimeSeconds: action.payload.spentTimeSeconds,
                     completed: action.payload.completed
                  }
               }
               return session
            })
         })
         .addCase(deleteSession.fulfilled, (state, action) => {
            state.sessions = state.sessions.filter((session: ISession) => session.id !== action.meta.arg)
         })
   }
})

export const { setCurrentSessionById, removeCurrentSession, addSecond } = sessionSlice.actions
export default sessionSlice.reducer