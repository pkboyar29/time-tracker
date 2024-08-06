import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './slices/sessionSlice';
import activityReducer from './slices/activitySlice';
import activityGroupReducer from './slices/activityGroupSlice';

export const store = configureStore({
  reducer: {
    sessions: sessionReducer,
    activities: activityReducer,
    activityGroups: activityGroupReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
