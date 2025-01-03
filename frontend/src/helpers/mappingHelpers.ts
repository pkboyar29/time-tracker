import { IActivity } from '../ts/interfaces/Activity/IActivity';
import { IActivityGroup } from '../ts/interfaces/ActivityGroup/IActivityGroup';
import { ISession } from '../ts/interfaces/Session/ISession';

// TODO: присваивать не только activityGroupId, но и название хранить
const mapActivityFromResponse = (unmappedActivity: any): IActivity => {
  return {
    ...unmappedActivity,
    id: unmappedActivity._id,
    activityGroup: {
      id: unmappedActivity.activityGroup._id,
      name: unmappedActivity.activityGroup.name,
    },
  };
};

const mapActivityGroupFromResponse = (
  unmappedActivityGroup: any
): IActivityGroup => {
  return {
    ...unmappedActivityGroup,
    id: unmappedActivityGroup._id,
  };
};

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

export {
  mapActivityFromResponse,
  mapActivityGroupFromResponse,
  mapSessionFromResponse,
};
