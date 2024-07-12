import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
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
      const mappedData = data.map((unmappedSession: any) => ({
         id: unmappedSession._id,
         ...unmappedSession
      }))
      return mappedData
   }
)

export const createSession = createAsyncThunk(
   'sessions/createSession',
   async (newSession: Session) => {
      const { data } = await axios.post('/sessions', newSession)
      const mappedData = {
         id: data._id,
         ...data
      }
      return mappedData
   }
)

export const updateSession = createAsyncThunk(
   'sessions/updateSession',
   async (existingSession: Session) => {
      const { data } = await axios.put(`/sessions/${existingSession.id}`, existingSession)
      const mappedData = {
         id: data._id,
         ...data
      }
      return mappedData
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