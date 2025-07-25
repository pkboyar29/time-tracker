import { configureStore, combineReducers } from '@reduxjs/toolkit';
import sessionReducer from './slices/sessionSlice';
import activityReducer from './slices/activitySlice';
import userReducer from './slices//userSlice';
import { useDispatch, useSelector } from 'react-redux';

const rootReducer = combineReducers({
  sessions: sessionReducer,
  activities: activityReducer,
  users: userReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
