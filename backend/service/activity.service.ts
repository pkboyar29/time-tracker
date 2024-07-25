import Activity from '../model/activity.model';
import { ActivityDTO } from '../dto/activity.dto';
import mongoose from 'mongoose';
import sessionService from './session.service';

export default {
  async getActivities() {
    try {
      const activities = await Activity.find({ deleted: false });

      const detailedActivitiesPromises = activities.map(async (activity: any) =>
        this.getActivity(activity._id)
      );
      const detailedActivities = await Promise.all(detailedActivitiesPromises); // wait for resolving all promises

      return detailedActivities;
    } catch (e) {
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  },

  async getActivity(activityId: string) {
    try {
      if (!(await this.existsActivity(activityId))) {
        throw new Error('Activity Not Found');
      }

      const activity = await Activity.findById(activityId);

      const sessions = await sessionService.getSessionsForActivity(activityId);
      const spentTimeSeconds = sessions?.reduce(
        (total: number, session: any) => total + session.spentTimeSeconds,
        0
      );

      return {
        ...activity?.toObject(),
        sessionsAmount: sessions?.length,
        spentTimeSeconds: spentTimeSeconds,
      };
    } catch (e) {
      console.log(e);
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  },

  async existsActivity(activityId: string) {
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

    return true;
  },

  async createActivity(activityDTO: ActivityDTO) {
    try {
      const newActivity = new Activity({
        name: activityDTO.name,
        descr: activityDTO.descr,
      });

      const newActivityWithId = await newActivity.save();

      return this.getActivity(newActivityWithId._id.toString());
    } catch (e) {
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  },

  async updateActivity(activityId: string, activityDTO: ActivityDTO) {
    try {
      if (!(await this.existsActivity(activityId))) {
        throw new Error('Activity Not Found');
      }

      await Activity.findById(activityId).updateOne({
        name: activityDTO.name,
        descr: activityDTO.descr,
        updatedDate: Date.now(),
      });

      return this.getActivity(activityId);
    } catch (e) {
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  },

  async deleteActivity(activityId: string) {
    try {
      if (!(await this.existsActivity(activityId))) {
        throw new Error('Activity Not Found');
      }

      const sessions = await sessionService.getSessionsForActivity(activityId);
      if (sessions && sessions.length > 0) {
        await Promise.all(
          sessions?.map(async (session) => {
            await sessionService.deleteSession(session._id.toString());
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
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  },
};
