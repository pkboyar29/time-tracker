import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './slices/sessionSlice';
import activityReducer from './slices/activitySlice';

export const store = configureStore({
  reducer: {
    sessions: sessionReducer,
    activities: activityReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
