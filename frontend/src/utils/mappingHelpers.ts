import { IActivity } from '../ts/interfaces/Activity/IActivity';
import { IActivityGroup } from '../ts/interfaces/ActivityGroup/IActivityGroup';
import { ISession } from '../ts/interfaces/Session/ISession';

export const mapActivityFromResponse = (unmappedActivity: any): IActivity => {
  return {
    ...unmappedActivity,
    id: unmappedActivity._id,
    activityGroupId: unmappedActivity.activityGroup,
  };
};

export const mapActivityGroupFromResponse = (
  unmappedActivityGroup: any
): IActivityGroup => {
  return {
    ...unmappedActivityGroup,
    id: unmappedActivityGroup._id,
  };
};

export const mapSessionFromResponse = (unmappedSession: any): ISession => {
  return {
    ...unmappedSession,
    id: unmappedSession._id,
    activity: unmappedSession.activity && {
      activityGroupName: unmappedSession.activity.activityGroup.name,
      name: unmappedSession.activity.name,
    },
  };
};
