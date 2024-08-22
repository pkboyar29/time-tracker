import instance from '../axios';
import { AxiosError } from 'axios';
import Cookies from 'js-cookie';

export const refreshAccessToken = async () => {
  const refreshToken = Cookies.get('refresh');
  try {
    console.log('trigger 33');
    const { data } = await instance.post('/users/refresh', {
      refreshToken,
    });
    Cookies.set('access', data.access);
  } catch (error) {
    Cookies.remove('access');
    Cookies.remove('refresh');
  }
};
