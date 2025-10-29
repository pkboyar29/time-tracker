import { configureStore, combineReducers } from '@reduxjs/toolkit';
import userReducer from './slices//userSlice';
import windowReducer from './slices/windowSlice';
import { useDispatch, useSelector } from 'react-redux';

const rootReducer = combineReducers({
  users: userReducer,
  window: windowReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
