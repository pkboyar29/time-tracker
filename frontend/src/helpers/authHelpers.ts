import instance from '../api/axios';
import Cookies from 'js-cookie';

const refreshAccessToken = async () => {
  const refreshToken = Cookies.get('refresh');
  try {
    const { data } = await instance.post('/users/refresh', {
      refreshToken,
    });
    Cookies.set('access', data.access);
  } catch (error) {
    // if refresh token is malformed or expired
    clearSession();
  }
};

const clearSession = () => {
  Cookies.remove('access');
  Cookies.remove('refresh');

  localStorage.removeItem('session');
};

const isAuth = () => {
  if (Cookies.get('refresh')) {
    return true;
  } else {
    return false;
  }
};

export { refreshAccessToken, clearSession, isAuth };
