import axios from './axios';

import { ISignIn, ISignUp, IUser } from '../ts/interfaces/User/IUser';

export const signIn = async (
  payload: ISignIn
): Promise<{ access: string; refresh: string }> => {
  const { data } = await axios.post('/users/sign-in', payload);

  return data;
};

export const signUp = async (
  payload: ISignUp
): Promise<{ access: string; refresh: string }> => {
  const { data } = await axios.post('/users/sign-up', payload);

  return data;
};

export const fetchProfileInfo = async (): Promise<IUser> => {
  const { data } = await axios.get('/users/profile');

  return { ...data, createdDate: new Date(data.createdDate) };
};

export const updateDailyGoal = async (
  newDailyGoal: number
): Promise<string> => {
  const { data } = await axios.put('/users/updateDailyGoal', { newDailyGoal });

  return data;
};

export const updateShowTimerInTitle = async (
  showTimerInTitle: boolean
): Promise<string> => {
  const { data } = await axios.put('/users/updateShowTimerInTitle', {
    showTimerInTitle,
  });

  return data;
};
