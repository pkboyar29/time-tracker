import Activity, {
  IActivity,
  IDetailedActivity,
} from '../model/activity.model';
import UserTopActivity from '../model/userTopActivity.model';
import { ActivityCreateDTO, ActivityUpdateDTO } from '../dto/activity.dto';
import sessionService from './session.service';
import activityGroupService from './activityGroup.service';
import analyticsService from './analytics.service';
import { HttpError } from '../helpers/HttpError';

import mongoose from 'mongoose';

interface PopulatedActivityGroup {
  _id: mongoose.Types.ObjectId;
  name: string;
}

interface GetActivitiesOptions {
  userId: string;
  activityGroupId?: string;
  sortByCreatedDate?: boolean; // true - -1 (descending), false - without sorting
  archived?: boolean;
}

interface GetDetailedActivitiesOptions {
  userId: string;
  activityGroupId?: string;
  onlyCompleted: boolean; // true - only completed sessions in detailed info, false - all sessions in detailed info
  archived?: boolean;
}

interface GetActivityOptions {
  activityId: string;
  userId: string;
}

interface GetDetailedActivityOptions {
  activityId: string;
  userId: string;
  onlyCompleted: boolean;
}

interface GetActivitiesForGroupOptions {
  activityGroupId: string;
  userId: string;
  detailed: boolean;
  onlyCompleted?: boolean;
}

interface GetSplitActivitiesOptions {
  userId: string;
  detailed: boolean;
}

const activityService = {
  getActivities,
  getDetailedActivities,
  getActivitiesForActivityGroup,
  getSplitActivities,
  getActivity,
  getDetailedActivity,
  createActivity,
  updateActivity,
  archiveActivity,
  deleteActivity,
  addActivityToLastActivities,
};

async function getActivities({
  userId,
  activityGroupId,
  sortByCreatedDate,
  archived,
}: GetActivitiesOptions): Promise<IActivity[]> {
  try {
    const filter: Record<string, unknown> = {
      deleted: false,
      user: userId,
      ...(activityGroupId && { activityGroup: activityGroupId }),
      ...(archived !== undefined && { archived }),
    };

    // TODO: вызывать метод lean?

    if (sortByCreatedDate) {
      return await Activity.find(filter).sort({ createdDate: -1 });
    }

    return await Activity.find(filter);
  } catch (e) {
    throw e;
  }
}

async function getDetailedActivities({
  userId,
  activityGroupId,
  onlyCompleted,
  archived,
}: GetDetailedActivitiesOptions): Promise<IDetailedActivity[]> {
  try {
    const filter = {
      userId,
      ...(activityGroupId && { activityGroupId }),
      ...(archived !== undefined && { archived }),
    };
    const allActivities = await activityService.getActivities(filter);

    // TODO: вместо вызова по отдельности getDetailedActivity как-то это делать более оптимизированно, чтобы не было такого количества запросов к БД
    const detailedAllActivities = await Promise.all(
      allActivities.map(async (a) =>
        activityService.getDetailedActivity({
          activityId: a._id.toString(),
          userId,
          onlyCompleted,
        })
      )
    );

    return detailedAllActivities;
  } catch (e) {
    throw e;
  }
}

async function getActivitiesForActivityGroup(options: {
  activityGroupId: string;
  userId: string;
  onlyCompleted?: boolean;
  detailed: true;
}): Promise<IDetailedActivity[]>;
async function getActivitiesForActivityGroup(options: {
  activityGroupId: string;
  userId: string;
  onlyCompleted?: boolean;
  detailed: false;
}): Promise<IActivity[]>;
async function getActivitiesForActivityGroup({
  activityGroupId,
  userId,
  detailed,
  onlyCompleted,
}: GetActivitiesForGroupOptions): Promise<IActivity[] | IDetailedActivity[]> {
  try {
    await activityGroupService.getActivityGroup({ activityGroupId, userId });

    if (detailed) {
      let onlyCompletedParam = onlyCompleted ? onlyCompleted : false;
      return await activityService.getDetailedActivities({
        userId,
        activityGroupId,
        onlyCompleted: onlyCompletedParam,
      });
    }

    return await activityService.getActivities({
      userId,
      activityGroupId,
      sortByCreatedDate: true,
    });
  } catch (e) {
    throw e;
  }
}

async function getSplitActivities(options: {
  userId: string;
  detailed: true;
}): Promise<{
  topActivities: IDetailedActivity[];
  remainingActivities: IDetailedActivity[];
}>;
async function getSplitActivities(options: {
  userId: string;
  detailed: false;
}): Promise<{
  topActivities: IActivity[];
  remainingActivities: IActivity[];
}>;
async function getSplitActivities({
  userId,
  detailed,
}: GetSplitActivitiesOptions) {
  let allActivities = [];
  if (detailed) {
    allActivities = await activityService.getDetailedActivities({
      userId,
      onlyCompleted: false,
      archived: false,
    });
  } else {
    allActivities = await activityService.getActivities({
      userId,
      archived: false,
    });
  }

  const userTopActivities = await UserTopActivity.find(
    { userId },
    'activityId'
  ).sort({
    createdDate: -1,
  });
  const topActivityIds = userTopActivities.map((a) => a.activityId.toString());
  const topActivityIdsSet = new Set(topActivityIds);

  const idMap = new Map(allActivities.map((a) => [a._id.toString(), a]));
  const topActivities = topActivityIds
    .map((id) => idMap.get(id))
    .filter(Boolean);

  const remainingActivities = allActivities.filter(
    (a) => !topActivityIdsSet.has(a._id.toString())
  );

  return {
    topActivities,
    remainingActivities,
  };
}

async function getActivity({
  activityId,
  userId,
}: GetActivityOptions): Promise<mongoose.HydratedDocument<IActivity>> {
  const notFoundError = new HttpError(404, 'Activity Not Found');
  try {
    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      throw notFoundError;
    }

    const activity = await Activity.findById(activityId)
      .populate<{ activityGroup: PopulatedActivityGroup }>(
        'activityGroup',
        'id name'
      )
      .exec();
    if (!activity) {
      throw notFoundError;
    }
    if (activity.deleted) {
      throw notFoundError;
    }

    if (activity.user.toString() !== userId) {
      throw notFoundError;
    }
    return activity;
  } catch (e) {
    throw e;
  }
}

async function getDetailedActivity({
  activityId,
  userId,
  onlyCompleted,
}: GetDetailedActivityOptions): Promise<IDetailedActivity> {
  try {
    const activity = await activityService.getActivity({ activityId, userId });

    const sessions = onlyCompleted
      ? await sessionService.getSessionsForActivity({
          activityId,
          userId,
          completed: onlyCompleted,
        })
      : await sessionService.getSessionsForActivity({ activityId, userId });
    const sessionsAmount = sessions.length;
    const spentTimeSeconds = sessions.reduce(
      (total: number, session) => total + session.spentTimeSeconds,
      0
    );
    return {
      ...activity.toObject(),
      sessionsAmount: sessionsAmount ?? 0,
      spentTimeSeconds: spentTimeSeconds ?? 0,
    };
  } catch (e) {
    throw e;
  }
}

async function createActivity(
  activityDTO: ActivityCreateDTO,
  userId: string
): Promise<IActivity> {
  try {
    await activityGroupService.getActivityGroup({
      activityGroupId: activityDTO.activityGroupId,
      userId,
    });

    const newActivity = new Activity({
      name: activityDTO.name,
      descr: activityDTO.descr,
      activityGroup: activityDTO.activityGroupId,
      user: userId,
    });

    const validationError = newActivity.validateSync();
    if (validationError) {
      if (validationError.errors.name) {
        throw new HttpError(400, validationError.errors.name.toString());
      }
      if (validationError.errors.descr) {
        throw new HttpError(400, validationError.errors.descr.toString());
      }
    }

    const newActivityWithId = await newActivity.save();
    return newActivityWithId;
  } catch (e) {
    throw e;
  }
}

// TODO: не надо возвращать detailed activity. просто возвращать activity?
async function updateActivity(
  activityId: string,
  activityDTO: ActivityUpdateDTO,
  userId: string
): Promise<IDetailedActivity> {
  try {
    const activity = await activityService.getActivity({ activityId, userId });

    activity.name = activityDTO.name;
    activity.descr = activityDTO.descr;
    activity.updatedDate = new Date();

    const validationError = activity.validateSync();
    if (validationError) {
      if (validationError.errors.name) {
        throw new HttpError(400, validationError.errors.name.toString());
      }
      if (validationError.errors.descr) {
        throw new HttpError(400, validationError.errors.descr.toString());
      }
    }

    await activity.save();

    await analyticsService.invalidateCache(userId);

    return activityService.getDetailedActivity({
      activityId,
      userId,
      onlyCompleted: false,
    });
  } catch (e) {
    throw e;
  }
}

async function archiveActivity(
  activityId: string,
  archived: boolean,
  userId: string
): Promise<IActivity> {
  const activity = await activityService.getActivity({ activityId, userId });
  activity.archived = archived;
  activity.save();

  return activity;
}

// TODO: делать это атомарно
async function deleteActivity(
  activityId: string,
  userId: string
): Promise<{ message: string }> {
  try {
    const activity = await activityService.getActivity({ activityId, userId });

    // TODO: удалять через updateMany
    const sessions = await sessionService.getSessionsForActivity({
      activityId,
      userId,
    });
    await Promise.all(
      sessions.map(async (session) => {
        await sessionService.deleteSession(session._id.toString(), userId);
      })
    );

    await activity.updateOne({
      deleted: true,
    });

    await analyticsService.invalidateCache(userId);

    return {
      message: 'Deleted successful',
    };
  } catch (e) {
    throw e;
  }
}

// TODO: надо поддерживать максимум 5 элементов атомарно (использовать атомарный вариант с upsert)
async function addActivityToLastActivities(activityId: string, userId: string) {
  try {
    const activity = await activityService.getActivity({ activityId, userId });
    if (activity.archived) {
      return;
    }
  } catch (e) {
    throw e;
  }

  const userLastActivities = await UserTopActivity.find({ userId }).sort({
    createdDate: 1,
  });

  const foundLastActivity = userLastActivities.find((lastActivity) =>
    lastActivity.activityId.equals(activityId)
  );
  if (!foundLastActivity) {
    if (userLastActivities.length == 5) {
      await userLastActivities[0].deleteOne();
    }

    await new UserTopActivity({
      userId,
      activityId,
      createdDate: new Date(),
    }).save();
  } else {
    // TODO: таким обновлением может идти два запроса к БД?
    foundLastActivity.createdDate = new Date();
    await foundLastActivity.save();
  }
}

export default activityService;
