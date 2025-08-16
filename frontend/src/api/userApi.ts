import axios from './axios';

import { ISignIn, ISignUp } from '../ts/interfaces/User/IUser';

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
