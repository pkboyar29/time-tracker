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
  _id: string;
  name: string;
}

interface GetActivitiesOptions {
  userId: string;
  activityGroupId?: string;
  sortByCreatedDate?: boolean; // true - -1 (descending), false - without sorting
}

interface GetDetailedActivitiesOptions {
  userId: string;
  activityGroupId?: string;
  onlyCompleted: boolean; // true - only completed sessions in detailed info, false - all sessions in detailed info
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
  getDetailedActivity,
  existsActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  addActivityToLastActivities,
};

async function getActivities({
  userId,
  activityGroupId,
  sortByCreatedDate,
}: GetActivitiesOptions): Promise<IActivity[]> {
  try {
    const filter: Record<string, unknown> = {
      deleted: false,
      user: userId,
      ...(activityGroupId && { activityGroup: activityGroupId }),
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
}: GetDetailedActivitiesOptions): Promise<IDetailedActivity[]> {
  try {
    const filter = {
      userId,
      ...(activityGroupId && { activityGroupId }),
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
    if (
      !(await activityGroupService.existsActivityGroup(activityGroupId, userId))
    ) {
      throw new HttpError(404, 'Activity Group Not Found');
    }

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
    });
  } else {
    allActivities = await activityService.getActivities({ userId });
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
    topActivities: topActivities,
    remainingActivities: remainingActivities,
  };
}

async function getDetailedActivity({
  activityId,
  userId,
  onlyCompleted,
}: GetDetailedActivityOptions): Promise<IDetailedActivity> {
  try {
    if (!(await activityService.existsActivity(activityId, userId))) {
      throw new HttpError(404, 'Activity Not Found');
    }

    const activity = await Activity.findById(activityId)
      .populate<{ activityGroup: PopulatedActivityGroup }>(
        'activityGroup',
        'id name'
      )
      .exec();

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
      ...activity!.toObject(),
      sessionsAmount: sessionsAmount ?? 0,
      spentTimeSeconds: spentTimeSeconds ?? 0,
    };
  } catch (e) {
    throw e;
  }
}

async function existsActivity(
  activityId: string,
  userId: string
): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(activityId)) {
    return false;
  }

  const activity = await Activity.findById(activityId);
  if (!activity) {
    return false;
  }

  if (activity.deleted) {
    return false;
  }

  if (activity.user.toString() !== userId) {
    return false;
  }

  return true;
}

// TODO: не надо возвращать detailed activity
async function createActivity(
  activityDTO: ActivityCreateDTO,
  userId: string
): Promise<IDetailedActivity> {
  try {
    if (
      !(await activityGroupService.existsActivityGroup(
        activityDTO.activityGroupId,
        userId
      ))
    ) {
      throw new HttpError(404, 'Activity Group Not Found');
    }

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

    return activityService.getDetailedActivity({
      activityId: newActivityWithId._id.toString(),
      userId,
      onlyCompleted: false,
    });
  } catch (e) {
    throw e;
  }
}

// TODO: не надо возвращать detailed activity
async function updateActivity(
  activityId: string,
  activityDTO: ActivityUpdateDTO,
  userId: string
): Promise<IDetailedActivity> {
  try {
    if (!(await activityService.existsActivity(activityId, userId))) {
      throw new HttpError(404, 'Activity Not Found');
    }

    const activity = await Activity.findById(activityId);
    activity!.name = activityDTO.name;
    activity!.descr = activityDTO.descr;
    activity!.updatedDate = new Date();

    const validationError = activity!.validateSync();
    if (validationError) {
      if (validationError.errors.name) {
        throw new HttpError(400, validationError.errors.name.toString());
      }
      if (validationError.errors.descr) {
        throw new HttpError(400, validationError.errors.descr.toString());
      }
    }

    await activity!.save();

    await analyticsService.invalidateAnalyticsCache(userId);

    return activityService.getDetailedActivity({
      activityId,
      userId,
      onlyCompleted: false,
    });
  } catch (e) {
    throw e;
  }
}

async function deleteActivity(
  activityId: string,
  userId: string
): Promise<{ message: string }> {
  try {
    if (!(await activityService.existsActivity(activityId, userId))) {
      throw new HttpError(404, 'Activity Not Found');
    }

    const sessions = await sessionService.getSessionsForActivity({
      activityId,
      userId,
    });
    await Promise.all(
      sessions.map(async (session) => {
        await sessionService.deleteSession(session._id.toString(), userId);
      })
    );

    await Activity.findById(activityId).updateOne({
      deleted: true,
    });

    await analyticsService.invalidateAnalyticsCache(userId);

    return {
      message: 'Deleted successful',
    };
  } catch (e) {
    throw e;
  }
}

// TODO: надо поддерживать максимум 5 элементов атомарно (использовать атомарный вариант с upsert)
async function addActivityToLastActivities(activityId: string, userId: string) {
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
