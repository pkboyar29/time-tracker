import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { refreshAccessToken } from './helpers/authHelpers';

const instance = axios.create({
  baseURL: 'http://localhost:8000',
});

instance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (config) => config,
  async (error) => {
    if (error instanceof AxiosError) {
      // if access token is expired or smt wrong with him
      if (error.response?.status === 403 || error.response?.status === 401) {
        // refresh access token
        await refreshAccessToken();

        // run previous request
        const accessToken = Cookies.get('access');
        const originalRequest = error.config;
        if (originalRequest) {
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          return axios.request(originalRequest);
        }
      }
    }
  }
);

export default instance;
