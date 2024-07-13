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
      const { data } = await axios.get('/sessions')
      const mappedData = data.map((unmappedSession: any) => mapSessionFromResponse(unmappedSession))
      return mappedData
   }
)

export const createSession = createAsyncThunk(
   'sessions/createSession',
   async (newSession: SessionCreateRequest) => {
      const { data } = await axios.post('/sessions', newSession)
      return mapSessionFromResponse(data)
   }
)

export const updateSession = createAsyncThunk(
   'sessions/updateSession',
   async (existingSession: Session) => {
      const { data } = await axios.put(`/sessions/${existingSession.id}`, existingSession)
      console.log(data)
      console.log(mapSessionFromResponse(data))
      return mapSessionFromResponse(data)
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
            // массив то судя по UI нифига не меняется
            state.sessions = state.sessions.map((session: Session) => {
               if (session.id === action.payload.id) {
                  console.log('триггер')
                  return {
                     ...session,
                     totalTimeSeconds: action.payload.totalTimeSeconds,
                     spentTimeSeconds: action.payload.spentTimeSeconds,
                     completed: action.payload.completed
                  }
               }
               return session
            })

            // если currentSession существует, то есть например при остановке таймера нам же скорее всего не нужно устанавливать текущую сессию, наверное это единственный способ понять это, хотя выглядит как костыль
            // if (state.currentSession) {
            // вот тут current session наверное надо пока просто менять, а не присваивать новое значение?
            //    state.currentSession = findSessionById(state.sessions, action.payload.id)
            // }
         })
   }
})

export const { setCurrentSessionById, removeCurrentSession, addSecond } = sessionSlice.actions
export default sessionSlice.reducer