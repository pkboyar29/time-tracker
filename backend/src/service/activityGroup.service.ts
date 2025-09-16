import mongoose from 'mongoose';
import ActivityGroup, {
  IActivityGroup,
  IDetailedActivityGroup,
} from '../model/activityGroup.model';
import { ActivityGroupDTO } from '../dto/activityGroup.dto';
import activityService from './activity.service';
import { HttpError } from '../helpers/HttpError';

interface GetActivityGroupsOptions {
  userId: string;
}

interface GetDetailedActivityGroupsOptions {
  userId: string;
  onlyCompleted: boolean;
}

interface GetDetailedActivityGroupOptions {
  activityGroupId: string;
  userId: string;
  onlyCompleted: boolean;
}

const activityGroupService = {
  getActivityGroups,
  getDetailedActivityGroups,
  getDetailedActivityGroup,
  existsActivityGroup,
  createActivityGroup,
  updateActivityGroup,
  deleteActivityGroup,
};

async function getActivityGroups({
  userId,
}: GetActivityGroupsOptions): Promise<IActivityGroup[]> {
  try {
    const filter = {
      deleted: false,
      user: userId,
    };
    const groups = await ActivityGroup.find(filter).sort({ createdDate: -1 });

    return groups;
  } catch (e) {
    throw e;
  }
}

async function getDetailedActivityGroups({
  userId,
  onlyCompleted,
}: GetDetailedActivityGroupsOptions): Promise<IDetailedActivityGroup[]> {
  const groups = await activityGroupService.getActivityGroups({ userId });

  const detailedGroups = await Promise.all(
    groups.map(async (group) =>
      activityGroupService.getDetailedActivityGroup({
        activityGroupId: group._id.toString(),
        userId,
        onlyCompleted,
      })
    )
  );

  return detailedGroups;
}

async function getDetailedActivityGroup({
  activityGroupId,
  userId,
  onlyCompleted,
}: GetDetailedActivityGroupOptions): Promise<IDetailedActivityGroup> {
  try {
    if (
      !(await activityGroupService.existsActivityGroup(activityGroupId, userId))
    ) {
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
    activities.forEach((activity) => {
      sessionsAmount += activity.sessionsAmount;
      spentTimeSeconds += activity.spentTimeSeconds;
    });

    return {
      ...activityGroup!.toObject(),
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

async function createActivityGroup(
  activityGroupDTO: ActivityGroupDTO,
  userId: string
): Promise<IDetailedActivityGroup> {
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

    return activityGroupService.getDetailedActivityGroup({
      activityGroupId: newActivityGroupWithId._id.toString(),
      userId,
      onlyCompleted: false,
    });
  } catch (e) {
    throw e;
  }
}

async function updateActivityGroup(
  activityGroupId: string,
  activityGroupDTO: ActivityGroupDTO,
  userId: string
): Promise<IDetailedActivityGroup> {
  try {
    if (
      !(await activityGroupService.existsActivityGroup(activityGroupId, userId))
    ) {
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

    return activityGroupService.getDetailedActivityGroup({
      activityGroupId,
      userId,
      onlyCompleted: false,
    });
  } catch (e) {
    throw e;
  }
}

async function deleteActivityGroup(
  activityGroupId: string,
  userId: string
): Promise<{ message: string }> {
  try {
    if (
      !(await activityGroupService.existsActivityGroup(activityGroupId, userId))
    ) {
      throw new HttpError(404, 'Activity Group Not Found');
    }

    const activities = await activityService.getActivitiesForActivityGroup({
      activityGroupId,
      userId,
      detailed: false,
    });
    await Promise.all(
      activities.map(async (activity) => {
        await activityService.deleteActivity(activity._id.toString(), userId);
      })
    );

    await ActivityGroup.findById(activityGroupId).updateOne({
      deleted: true,
    });

    return {
      message: 'Deleted successful',
    };
  } catch (e) {
    throw e;
  }
}

export default activityGroupService;
