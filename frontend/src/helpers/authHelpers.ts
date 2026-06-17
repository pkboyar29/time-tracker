import { AxiosError } from 'axios';
import instance from '../api/axios';
import Cookies from 'js-cookie';

const clearAuthSession = () => {
  Cookies.remove('access');
  Cookies.remove('refresh');

  localStorage.removeItem('session');
};

const refreshAccessToken = async () => {
  const refreshToken = Cookies.get('refresh');
  try {
    const { data } = await instance.post('/users/refresh', {
      refreshToken,
    });
    Cookies.set('access', data.access);
  } catch (error) {
    if (!(error instanceof AxiosError)) {
      return;
    }

    // if refresh token is malformed or expired
    if (error.response?.status === 401) {
      clearAuthSession();
    }
  }
};

const isAuth = () => {
  if (Cookies.get('refresh')) {
    return true;
  } else {
    return false;
  }
};

export { refreshAccessToken, clearAuthSession, isAuth };
