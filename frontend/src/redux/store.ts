import { configureStore, combineReducers } from '@reduxjs/toolkit';
import sessionReducer from './slices/sessionSlice';
import activityReducer from './slices/activitySlice';
import activityGroupReducer from './slices/activityGroupSlice';

const rootReducer = combineReducers({
  sessions: sessionReducer,
  activities: activityReducer,
  activityGroups: activityGroupReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
