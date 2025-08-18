import Activity from '../model/activity.model';
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
      const activities = await Activity.find({
        deleted: false,
        user: userId,
      });
      const detailedActivities = await Promise.all(
        activities.map(async (activity) =>
          this.getActivity(activity._id.toString(), userId)
        )
      );

      return detailedActivities;
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

  handleError(e: unknown) {
    if (e instanceof Error || e instanceof HttpError) {
      throw e;
    }
  },
};
