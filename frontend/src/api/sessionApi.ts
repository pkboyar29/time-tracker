import axios from './axios';

import { ISession } from '../ts/interfaces/Session/ISession';
import { ISessionCreate } from '../ts/interfaces/Session/ISessionCreate';

const mapResponseData = (unmappedSession: any): ISession => {
  return {
    ...unmappedSession,
    id: unmappedSession._id,
    activity: unmappedSession.activity && {
      activityGroupName: unmappedSession.activity.activityGroup.name,
      name: unmappedSession.activity.name,
    },
  };
};

export const fetchSession = async (sessionId: string): Promise<ISession> => {
  const { data } = await axios.get(`/sessions/${sessionId}`);

  return mapResponseData(data);
};

export const fetchSessions = async (
  params: Record<string, unknown>
): Promise<ISession[]> => {
  const { data } = await axios.get('/sessions', {
    params: {
      ...params,
    },
  });

  const mappedData: ISession[] = data.map((unmappedSession: any) =>
    mapResponseData(unmappedSession)
  );

  return mappedData;
};

export const createSession = async (
  payload: ISessionCreate
): Promise<ISession> => {
  const { data } = await axios.post('/sessions', payload);

  return mapResponseData(data);
};

export const updateSession = async (payload: ISession): Promise<ISession> => {
  const { data } = await axios.put(`/sessions/${payload.id}`, payload);

  return mapResponseData(data);
};

export const deleteSession = async (sessionId: string): Promise<string> => {
  const { data } = await axios.delete(`/sessions/${sessionId}`);

  return data;
};
