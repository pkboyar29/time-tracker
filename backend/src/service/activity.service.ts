import Activity from '../model/activity.model';
import UserTopActivity from '../model/userTopActivity.model';
import { ActivityCreateDTO, ActivityUpdateDTO } from '../dto/activity.dto';
import mongoose from 'mongoose';
import sessionService from './session.service';
import activityGroupService from './activityGroup.service';
import { HttpError } from '../helpers/HttpError';

interface PopulatedActivityGroup {
  _id: string;
  name: string;
}

export default {
  async getActivities(userId: string) {
    try {
      const allActivities = await Activity.find({
        deleted: false,
        user: userId,
      });

      const detailedAllActivities = await Promise.all(
        allActivities.map(async (a) =>
          this.getActivity(a._id.toString(), userId)
        )
      );

      return detailedAllActivities;
    } catch (e) {
      this.handleError(e);
    }
  },

  async getActivitiesForActivityGroup(
    activityGroupId: string,
    userId: string,
    completed?: boolean
  ) {
    try {
      if (
        !(await activityGroupService.existsActivityGroup(
          activityGroupId,
          userId
        ))
      ) {
        throw new HttpError(404, 'Activity Group Not Found');
      }
      const activities = await Activity.find({
        deleted: false,
        activityGroup: activityGroupId,
        user: userId,
      }).sort({ createdDate: -1 });
      const detailedActivitiesPromises = activities.map(async (activity) =>
        completed !== undefined
          ? this.getActivity(activity._id.toString(), userId, completed)
          : this.getActivity(activity._id.toString(), userId)
      );
      const detailedActivities = await Promise.all(detailedActivitiesPromises); // wait for resolving all promises

      return detailedActivities;
    } catch (e) {
      this.handleError(e);
    }
  },

  async getSplitActivities(userId: string) {
    const detailedAllActivities = await this.getActivities(userId);

    const topActivities = await UserTopActivity.find(
      { userId },
      'activityId'
    ).sort({
      createdDate: -1,
    });
    const topActivityIds = topActivities.map((a) => a.activityId.toString());
    const topActivityIdsSet = new Set(topActivityIds);

    const idMap = new Map(
      detailedAllActivities?.map((a) => [a?._id!.toString(), a])
    );
    const detailedTopActivities = topActivityIds
      .map((id) => idMap.get(id))
      .filter(Boolean);
    const detailedRemainingActivities = detailedAllActivities?.filter(
      (a) => !topActivityIdsSet.has(a!._id!.toString())
    );

    return {
      topActivities: detailedTopActivities,
      remainingActivities: detailedRemainingActivities,
    };
  },

  async getActivity(activityId: string, userId: string, completed?: boolean) {
    try {
      if (!(await this.existsActivity(activityId, userId))) {
        throw new HttpError(404, 'Activity Not Found');
      }

      const activity = await Activity.findById(activityId)
        .populate<{ activityGroup: PopulatedActivityGroup }>(
          'activityGroup',
          'id name'
        )
        .exec();

      const sessions =
        completed !== undefined
          ? await sessionService.getSessionsForActivity(
              activityId,
              userId,
              completed
            )
          : await sessionService.getSessionsForActivity(activityId, userId);
      const spentTimeSeconds = sessions?.reduce(
        (total: number, session) => total + session.spentTimeSeconds,
        0
      );

      return {
        ...activity?.toObject(),
        sessionsAmount: sessions?.length ?? 0,
        spentTimeSeconds: spentTimeSeconds ?? 0,
      };
    } catch (e) {
      this.handleError(e);
    }
  },

  async existsActivity(activityId: string, userId: string) {
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
  },

  async createActivity(activityDTO: ActivityCreateDTO, userId: string) {
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

      return this.getActivity(newActivityWithId._id.toString(), userId);
    } catch (e) {
      this.handleError(e);
    }
  },

  async updateActivity(
    activityId: string,
    activityDTO: ActivityUpdateDTO,
    userId: string
  ) {
    try {
      if (!(await this.existsActivity(activityId, userId))) {
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

      return this.getActivity(activityId, userId);
    } catch (e) {
      this.handleError(e);
    }
  },

  async deleteActivity(activityId: string, userId: string) {
    try {
      if (!(await this.existsActivity(activityId, userId))) {
        throw new HttpError(404, 'Activity Not Found');
      }

      const sessions = await sessionService.getSessionsForActivity(
        activityId,
        userId
      );
      if (sessions && sessions.length > 0) {
        await Promise.all(
          sessions?.map(async (session) => {
            await sessionService.deleteSession(session._id.toString(), userId);
          })
        );
      }

      await Activity.findById(activityId).updateOne({
        deleted: true,
      });

      const message = {
        message: 'Deleted successful',
      };
      return message;
    } catch (e) {
      this.handleError(e);
    }
  },

  // TODO: надо поддерживать максимум 5 элементов атомарно (использовать атомарный вариант с upsert)
  async addActivityToLastActivities(activityId: string, userId: string) {
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
  },

  handleError(e: unknown) {
    if (e instanceof Error || e instanceof HttpError) {
      throw e;
    }
  },
};
