import Activity, { IActivity } from '../model/activity.model';
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

interface GetActivityOptions {
  activityId: string;
  userId: string;
}

interface GetSplitActivitiesOptions {
  userId: string;
}

const activityService = {
  getActivities,
  getSplitActivities,
  getActivity,
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
    activityGroupId &&
      (await activityGroupService.getActivityGroup({
        activityGroupId,
        userId,
      }));

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

async function getSplitActivities({
  userId,
}: GetSplitActivitiesOptions): Promise<{
  topActivities: IActivity[];
  remainingActivities: IActivity[];
}> {
  const allActivities = await activityService.getActivities({
    userId,
    archived: false,
  });

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
    .filter((a): a is IActivity => Boolean(a));

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

    let activity = await Activity.findById(activityId)
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

async function updateActivity(
  activityId: string,
  activityDTO: ActivityUpdateDTO,
  userId: string
): Promise<IActivity> {
  try {
    const activity = await activityService.getActivity({
      activityId,
      userId,
    });

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

    return activity;
  } catch (e) {
    throw e;
  }
}

async function archiveActivity(
  activityId: string,
  archived: boolean,
  userId: string
): Promise<IActivity> {
  const activity = await activityService.getActivity({
    activityId,
    userId,
  });
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
    const activity = await activityService.getActivity({
      activityId,
      userId,
    });

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
    const activity = await activityService.getActivity({
      activityId,
      userId,
    });
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
