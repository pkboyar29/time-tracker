import { IActivity } from '../ts/interfaces/Activity/IActivity';
import { IActivityGroup } from '../ts/interfaces/ActivityGroup/IActivityGroup';
import { ISession } from '../ts/interfaces/Session/ISession';

export const mapActivityFromResponse = (unmappedActivity: any): IActivity => {
  return {
    id: unmappedActivity._id,
    activityGroupId: unmappedActivity.activityGroup,
    ...unmappedActivity,
  };
};

export const mapActivityGroupFromResponse = (
  unmappedActivityGroup: any
): IActivityGroup => {
  return {
    id: unmappedActivityGroup._id,
    ...unmappedActivityGroup,
  };
};

export const mapSessionFromResponse = (unmappedSession: any): ISession => {
  return {
    id: unmappedSession._id,
    activity: unmappedSession.activity && {
      id: unmappedSession.activity._id,
      ...unmappedSession.activity,
    },
    ...unmappedSession,
  };
};
