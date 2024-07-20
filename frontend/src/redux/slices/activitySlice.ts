import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from '../../axios'
import { mapActivityFromResponse } from '../../utils/mappingHelpers'

interface ActivityState {
   activities: Activity[],
   status: string
}

const initialState: ActivityState = {
   activities: [],
   status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
}

export const fetchActivities = createAsyncThunk(
   'activities/fetchActivities',
   async () => {
      const { data: unmappedData } = await axios.get('/activities')
      console.log(unmappedData)
      const mappedData = unmappedData.map((unmappedActivity: any) => mapActivityFromResponse(unmappedActivity))
      return mappedData
   }
)

export const createActivity = createAsyncThunk(
   'activities/createActivity',
   async (newActivityData: ActivityCreateRequest) => {
      const { data: unmappedData } = await axios.post('/activities', newActivityData)
      const mappedData = mapActivityFromResponse(unmappedData)
      return mappedData
   }
)

export const updateActivity = createAsyncThunk(
   'activities/updateActivity',
   async (existingActivityData: Activity) => {
      const { data: unmappedData } = await axios.put(`/activities/${existingActivityData.id}`, existingActivityData)
      const mappedData = mapActivityFromResponse(unmappedData)
      return mappedData
   }
)

export const deleteActivity = createAsyncThunk(
   'activities/deleteActivity',
   async (activityId: string) => {
      const { data } = await axios.delete(`/activities/${activityId}`)
      return data
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
         .addCase(updateActivity.fulfilled, (state, action) => {
            state.activities = state.activities.map((activity: Activity) => {
               if (activity.id === action.payload.id) {
                  return {
                     ...activity,
                     name: action.payload.name,
                     descr: action.payload.descr
                  }
               }
               return activity
            })
         })
         .addCase(deleteActivity.fulfilled, (state, action) => {
            state.activities = state.activities.filter((activity: Activity) => activity.id !== action.meta.arg)
         })
   }
})

// export const {  } = activitySlice.actions
export default activitySlice.reducer