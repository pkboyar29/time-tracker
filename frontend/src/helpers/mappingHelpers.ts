import { ISession } from '../ts/interfaces/Session/ISession';

const mapSessionFromResponse = (unmappedSession: any): ISession => {
  return {
    ...unmappedSession,
    id: unmappedSession._id,
    activity: unmappedSession.activity && {
      activityGroupName: unmappedSession.activity.activityGroup.name,
      name: unmappedSession.activity.name,
    },
  };
};

export { mapSessionFromResponse };
