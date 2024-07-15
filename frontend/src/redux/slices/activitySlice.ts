import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from '../../axios'

interface ActivityState {
   activities: Activity[],
   status: string
}

const initialState: ActivityState = {
   activities: [],
   status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
}

const mapActivityFromResponse = (unmappedActivity: any): Activity => {
   return {
      id: unmappedActivity._id,
      name: unmappedActivity.name,
      descr: unmappedActivity.descr
   }
}

export const fetchActivities = createAsyncThunk(
   'activities/fetchActivities',
   async () => {
      const { data } = await axios.get('/activities')
      const mappedData = data.map((unmappedActivity: any) => mapActivityFromResponse(unmappedActivity))
      return mappedData
   }
)

export const createActivity = createAsyncThunk(
   'activities/createActivity',
   async (newActivityData: ActivityCreateRequest) => {
      const { data } = await axios.post('/activities', newActivityData)
      const mappedData = mapActivityFromResponse(data)
      return mappedData
   }
)

const activitySlice = createSlice({
   name: 'activities',
   initialState,
   reducers: {},
   extraReducers: (builder) => {
      builder
         .addCase(fetchActivities.pending, (state) => {
            console.log('fetchActivities.pending')
            state.status = 'loading'
         })
         .addCase(fetchActivities.fulfilled, (state, action) => {
            console.log('fetchActivities.fulfilled')
            console.log(action.payload)
            state.status = 'succeeded'
            state.activities = action.payload
         })
         .addCase(fetchActivities.rejected, (state) => {
            state.status = 'failed'
         })
         .addCase(createActivity.fulfilled, (state, action) => {
            state.activities.push(action.payload)
         })
   }
})

// export const {  } = activitySlice.actions
export default activitySlice.reducer