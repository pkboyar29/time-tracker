import mongoose from 'mongoose';
import ActivityGroup, { IActivityGroup } from '../model/activityGroup.model';
import Activity from '../model/activity.model';
import { ActivityGroupDTO } from '../dto/activityGroup.dto';
import activityService from './activity.service';
import { HttpError } from '../helpers/HttpError';

interface GetActivityGroupsOptions {
  userId: string;
}

interface GetActivityGroupOptions {
  activityGroupId: string;
  userId: string;
}

const activityGroupService = {
  getActivityGroups,
  getActivityGroup,
  createActivityGroup,
  updateActivityGroup,
  archiveGroupActivities,
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

async function getActivityGroup({
  activityGroupId,
  userId,
}: GetActivityGroupOptions): Promise<
  mongoose.HydratedDocument<IActivityGroup>
> {
  const notFoundError = new HttpError(404, 'Activity Group Not Found');
  try {
    if (!mongoose.Types.ObjectId.isValid(activityGroupId)) {
      throw notFoundError;
    }

    const activityGroup = await ActivityGroup.findById(activityGroupId).exec();
    if (!activityGroup) {
      throw notFoundError;
    }
    if (activityGroup.deleted) {
      throw notFoundError;
    }
    if (activityGroup.user.toString() !== userId) {
      throw notFoundError;
    }

    return activityGroup;
  } catch (e) {
    throw e;
  }
}

async function createActivityGroup(
  activityGroupDTO: ActivityGroupDTO,
  userId: string,
): Promise<IActivityGroup> {
  try {
    const newActivityGroup = new ActivityGroup({
      name: activityGroupDTO.name,
      descr: activityGroupDTO.descr,
      user: userId,
      createdDate: new Date(),
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

    return newActivityGroupWithId;
  } catch (e) {
    throw e;
  }
}

async function updateActivityGroup(
  activityGroupId: string,
  activityGroupDTO: ActivityGroupDTO,
  userId: string,
): Promise<IActivityGroup> {
  try {
    const activityGroup = await activityGroupService.getActivityGroup({
      activityGroupId,
      userId,
    });
    activityGroup.name = activityGroupDTO.name;
    activityGroup.descr = activityGroupDTO.descr;
    activityGroup.updatedDate = new Date();

    const validationError = activityGroup.validateSync();
    if (validationError) {
      if (validationError.errors.name) {
        throw new HttpError(400, validationError.errors.name.toString());
      }
      if (validationError.errors.descr) {
        throw new HttpError(400, validationError.errors.descr.toString());
      }
    }

    await activityGroup.save();

    return activityGroupService.getActivityGroup({
      activityGroupId,
      userId,
    });
  } catch (e) {
    throw e;
  }
}

async function archiveGroupActivities(
  activityGroupId: string,
  userId: string,
): Promise<{ message: string }> {
  await activityGroupService.getActivityGroup({ activityGroupId, userId });

  await Activity.updateMany(
    { activityGroup: activityGroupId },
    { archived: true },
  );

  return { message: 'Archived all activities successful' };
}

async function deleteActivityGroup(
  activityGroupId: string,
  userId: string,
): Promise<{ message: string }> {
  try {
    await activityGroupService.getActivityGroup({ activityGroupId, userId });

    // TODO: удалять через updateMany, только тут как-то еще сессии для каждой активности удалять через updateMany
    const activities = await activityService.getActivities({
      activityGroupId,
      userId,
    });
    await Promise.all(
      activities.map(async (activity) => {
        await activityService.deleteActivity(activity._id.toString(), userId);
      }),
    );

    await ActivityGroup.findById(activityGroupId).updateOne({
      deleted: true,
    });

    return {
      message: 'Deleted successfuly',
    };
  } catch (e) {
    throw e;
  }
}

export default activityGroupService;
