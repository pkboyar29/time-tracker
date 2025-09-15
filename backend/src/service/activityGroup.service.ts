import mongoose from 'mongoose';
import ActivityGroup from '../model/activityGroup.model';
import { ActivityGroupDTO } from '../dto/activityGroup.dto';
import activityService from './activity.service';
import { HttpError } from '../helpers/HttpError';
import { IDetailedActivity } from '../model/activity.model';

// TODO: добавить return type
async function getActivityGroups(userId: string, onlyCompleted: boolean) {
  try {
    const activityGroups = await ActivityGroup.find({
      deleted: false,
      user: userId,
    }).sort({ createdDate: -1 });

    const detailedActivityGroups = await Promise.all(
      activityGroups.map(async (activityGroup) =>
        getActivityGroup(activityGroup._id.toString(), userId, true)
      )
    );

    return detailedActivityGroups;
  } catch (e) {
    throw e;
  }
}

// TODO: добавить return type
async function getActivityGroup(
  activityGroupId: string,
  userId: string,
  onlyCompleted: boolean
) {
  try {
    if (!(await existsActivityGroup(activityGroupId, userId))) {
      throw new HttpError(404, 'Activity Group Not Found');
    }
    const activityGroup = await ActivityGroup.findById(activityGroupId);

    const activities = await activityService.getActivitiesForActivityGroup({
      activityGroupId: activityGroupId,
      userId,
      detailed: true,
      onlyCompleted,
    });
    let sessionsAmount: number = 0;
    let spentTimeSeconds: number = 0;
    if (activities) {
      (activities as IDetailedActivity[]).forEach((activity) => {
        if (activity.sessionsAmount && activity.spentTimeSeconds) {
          sessionsAmount += activity.sessionsAmount;
          spentTimeSeconds += activity.spentTimeSeconds;
        }
      });
    }

    return {
      ...activityGroup?.toObject(),
      sessionsAmount,
      spentTimeSeconds,
    };
  } catch (e) {
    throw e;
  }
}

async function existsActivityGroup(
  activityGroupId: string,
  userId: string
): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(activityGroupId)) {
    return false;
  }

  const activityGroup = await ActivityGroup.findById(activityGroupId);
  if (!activityGroup) {
    return false;
  }

  if (activityGroup.deleted) {
    return false;
  }

  if (activityGroup.user.toString() !== userId) {
    return false;
  }

  return true;
}

// TODO: добавить return type
async function createActivityGroup(
  activityGroupDTO: ActivityGroupDTO,
  userId: string
) {
  try {
    const newActivityGroup = new ActivityGroup({
      name: activityGroupDTO.name,
      descr: activityGroupDTO.descr,
      user: userId,
    });

    const validationError = newActivityGroup.validateSync();
    if (validationError) {
      if (validationError.errors.name) {
        throw new HttpError(400, validationError.errors.name.toString());
      }
      if (validationError.errors.descr) {
        throw new HttpError(400, validationError.errors.descr.toString());
      }
    }

    const newActivityGroupWithId = await newActivityGroup.save();

    return getActivityGroup(
      newActivityGroupWithId._id.toString(),
      userId,
      true
    );
  } catch (e) {
    throw e;
  }
}

// TODO: добавить return type
async function updateActivityGroup(
  activityGroupId: string,
  activityGroupDTO: ActivityGroupDTO,
  userId: string
) {
  try {
    if (!(await existsActivityGroup(activityGroupId, userId))) {
      throw new HttpError(404, 'Activity Group Not Found');
    }

    const activityGroup = await ActivityGroup.findById(activityGroupId);
    activityGroup!.name = activityGroupDTO.name;
    activityGroup!.descr = activityGroupDTO.descr;
    activityGroup!.updatedDate = new Date();

    const validationError = activityGroup!.validateSync();
    if (validationError) {
      if (validationError.errors.name) {
        throw new HttpError(400, validationError.errors.name.toString());
      }
      if (validationError.errors.descr) {
        throw new HttpError(400, validationError.errors.descr.toString());
      }
    }

    await activityGroup!.save();

    return getActivityGroup(activityGroupId, userId, true);
  } catch (e) {
    throw e;
  }
}

// TODO: добавить return type
async function deleteActivityGroup(activityGroupId: string, userId: string) {
  try {
    if (!(await existsActivityGroup(activityGroupId, userId))) {
      throw new HttpError(404, 'Activity Group Not Found');
    }

    const activities = await activityService.getActivitiesForActivityGroup({
      activityGroupId,
      userId,
      detailed: false,
    });
    if (activities && activities.length > 0) {
      await Promise.all(
        activities?.map(async (activity) => {
          if (activity) {
            if (activity._id) {
              await activityService.deleteActivity(
                activity._id.toString(),
                userId
              );
            }
          }
        })
      );
    }

    await ActivityGroup.findById(activityGroupId).updateOne({
      deleted: true,
    });

    const message = {
      message: 'Deleted successful',
    };
    return message;
  } catch (e) {
    throw e;
  }
}

export default {
  getActivityGroups,
  getActivityGroup,
  existsActivityGroup,
  createActivityGroup,
  updateActivityGroup,
  deleteActivityGroup,
};
