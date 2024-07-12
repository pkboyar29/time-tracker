import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from '../../axios'

interface SessionState {
   sessions: Session[],
   status: string,
   currentSession: Session | null
}

const initialState: SessionState = {
   sessions: [],
   status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
   currentSession: null
}

const mapSessionFromResponse = (unmappedSession: any): Session => {
   return {
      id: unmappedSession._id,
      totalTimeSeconds: unmappedSession.totalTimeSeconds,
      spentTimeSeconds: unmappedSession.spentTimeSeconds,
      completed: unmappedSession.completed,
   }
}

const findSessionById = (sessions: Session[], id: string): Session | null => {
   return sessions.find((session: Session) => session.id === id) || null
}

export const fetchSessions = createAsyncThunk(
   'sessions/fetchSessions',
   async () => {
      const response = await axios.get('/sessions')
      const mappedData = response.data.map((unmappedSession: any) => mapSessionFromResponse(unmappedSession))
      return mappedData
   }
)

export const createSession = createAsyncThunk(
   'sessions/createSession',
   async (newSession: SessionCreateRequest) => {
      const response = await axios.post('/sessions', newSession)
      return mapSessionFromResponse(response.data)
   }
)

export const updateSession = createAsyncThunk(
   'sessions/updateSession',
   async (existingSession: Session) => {
      const response = await axios.put(`/sessions/${existingSession.id}`, existingSession)
      return mapSessionFromResponse(response.data)
   }
)

const sessionSlice = createSlice({
   name: 'sessions',
   initialState,
   reducers: {
      setCurrentSessionById(state, action: PayloadAction<string>) {
         state.currentSession = findSessionById(state.sessions, action.payload);
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
            state.currentSession = findSessionById(state.sessions, action.payload.id);
         })
         .addCase(updateSession.fulfilled, (state, action) => {

         })
   }
})

export const { setCurrentSessionById } = sessionSlice.actions
export default sessionSlice.reducer