import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from '../../axios'

interface SessionState {
   sessions: Session[],
   status: string
}

const initialState: SessionState = {
   sessions: [],
   status: 'idle' // 'idle' | 'loading' | 'succeeded' | 'failed'
}

export const fetchSessions = createAsyncThunk(
   'sessions/fetchSessions',
   async () => {
      const { data } = await axios.get('/sessions')
      return data
   }
)

export const createSession = createAsyncThunk(
   'sessions/createSession',
   async (newSession: Session) => {
      const { data } = await axios.post('/sessions', newSession)
      return data
   }
)

export const updateSession = createAsyncThunk(
   'sessions/updateSession',
   async (existingSession: Session) => {
      const { data } = await axios.put(`/sessions/${existingSession._id}`, existingSession)
      return data
   }
)

const sessionSlice = createSlice({
   name: 'sessions',
   initialState,
   reducers: {},
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
         })
   }
})

export default sessionSlice.reducer