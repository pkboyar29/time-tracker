import { app } from '../../../app';
import supertest from 'supertest';

export const authorizedRequest = (accessToken: string) => {
  const request = supertest(app);

  return {
    get: (url: string) =>
      request.get(url).set('Authorization', `Bearer ${accessToken}`),
    post: (url: string) =>
      request.post(url).set('Authorization', `Bearer ${accessToken}`),
    put: (url: string) =>
      request.put(url).set('Authorization', `Bearer ${accessToken}`),
    delete: (url: string) =>
      request.delete(url).set('Authorization', `Bearer ${accessToken}`),
  };
};
