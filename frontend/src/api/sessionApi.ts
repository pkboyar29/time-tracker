import axios from './axios';
import { getNoteFromLS } from '../helpers/localstorageHelpers';

import { ISession } from '../ts/interfaces/Session/ISession';
import { ISessionCreate } from '../ts/interfaces/Session/ISessionCreate';

const mapResponseData = (unmappedSession: any): ISession => {
  return {
    ...unmappedSession,
    id: unmappedSession._id,
    activity: unmappedSession.activity && {
      name: unmappedSession.activity.name,
      color: unmappedSession.activity.color,
      activityGroupName: unmappedSession.activity.activityGroup.name,
    },
  };
};

export const fetchSession = async (sessionId: string): Promise<ISession> => {
  const { data } = await axios.get(`/sessions/${sessionId}`);

  return mapResponseData(data);
};

export const fetchSessions = async (params: Record<string, unknown>): Promise<ISession[]> => {
  const { data } = await axios.get('/sessions', {
    params: {
      ...params,
    },
  });

  const mappedData: ISession[] = data.map((unmappedSession: any) =>
    mapResponseData(unmappedSession),
  );

  return mappedData;
};

export const createSession = async (payload: ISessionCreate): Promise<ISession> => {
  // const { data } = await axios.post('/sessions', {
  //   ...payload,
  //   totalSeconds: 20,
  // });
  const { data } = await axios.post('/sessions', payload);

  return mapResponseData(data);
};

export const updateSession = async (payload: {
  session: ISession;
  isPaused: boolean;
}): Promise<ISession> => {
  const session = payload.session;
  const noteFromLS = getNoteFromLS(session.id);
  const body = {
    spentSeconds: session.spentSeconds,
    totalSeconds: session.totalSeconds,
    note: noteFromLS,
    isPaused: payload.isPaused,
  };

  const { data } = await axios.put(`/sessions/${session.id}`, body);

  return mapResponseData(data);
};

export const updateSessionNote = async (sessionId: string) => {
  const noteFromLS = getNoteFromLS(sessionId);

  const body = {
    note: noteFromLS,
  };

  const { data } = await axios.patch(`/sessions/${sessionId}/note`, body);

  return mapResponseData(data);
};

export const deleteSession = async (sessionId: string): Promise<string> => {
  const { data } = await axios.delete(`/sessions/${sessionId}`);

  return data;
};
