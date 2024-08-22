import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';

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
      // if access token is expired or stm wrong with him
      if (error.response?.status === 403 || error.response?.status === 401) {
        const refreshToken = Cookies.get('refresh');
        try {
          const { data } = await instance.post('/users/refresh', {
            refreshToken,
          });
          Cookies.set('access', data.access);

          // run previous request
          const originalRequest = error.config;
          if (originalRequest) {
            originalRequest.headers['Authorization'] = `Bearer ${data.access}`;
            return axios.request(originalRequest);
          }
        } catch (e) {
          if (e instanceof AxiosError) {
            // if refresh token is expired or stm wrong with him
            // TODO: delete all cookies and then react router dom do redirect to sign in page?
          }
        }
      }
    }
  }
);

export default instance;
