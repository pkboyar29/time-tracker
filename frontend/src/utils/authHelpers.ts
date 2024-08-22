import instance from '../axios';
import Cookies from 'js-cookie';

export const refreshAccessToken = async () => {
  const refreshToken = Cookies.get('refresh');
  try {
    const { data } = await instance.post('/users/refresh', {
      refreshToken,
    });
    Cookies.set('access', data.access);
  } catch (error) {
    // if refresh token is malformed or expired
    Cookies.remove('access');
    Cookies.remove('refresh');
  }
};