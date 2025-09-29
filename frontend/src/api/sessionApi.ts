import axios from './axios';

import { ISession } from '../ts/interfaces/Session/ISession';

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
