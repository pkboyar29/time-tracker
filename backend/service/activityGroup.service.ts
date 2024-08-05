import mongoose from 'mongoose';
import ActivityGroup from '../model/activityGroup.model';
import { ActivityGroupDTO } from '../dto/activityGroup.dto';
import activityService from './activity.service';

export default {
  async getActivityGroups() {
    try {
      const activityGroups = await ActivityGroup.find({ deleted: false });

      const detailedActivityGroups = await Promise.all(
        activityGroups.map(async (activityGroup) => {
          return this.getActivityGroup(activityGroup._id.toString());
        })
      );

      return detailedActivityGroups;
    } catch (e) {
      console.log(e);
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  },

  async getActivityGroup(activityGroupId: string) {
    try {
      if (!(await this.existsActivityGroup(activityGroupId))) {
        throw new Error('Activity Group Not Found');
      }
      const activityGroup = await ActivityGroup.findById(activityGroupId);

      const activities = await activityService.getActivitiesForActivityGroup(
        activityGroupId
      );
      let sessionsAmount = 0;
      let spentTimeSeconds = 0;

      if (activities) {
        activities.forEach((activity) => {
          if (activity?.sessionsAmount && activity.spentTimeSeconds) {
            sessionsAmount += activity?.sessionsAmount;
            spentTimeSeconds += activity?.spentTimeSeconds;
          }
        });
      }

      return {
        ...activityGroup?.toObject(),
        sessionsAmount,
        spentTimeSeconds,
      };
    } catch (e) {
      console.log(e);
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  },

  async existsActivityGroup(activityGroupId: string) {
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

    return true;
  },

  async createActivityGroup(activityGroupDTO: ActivityGroupDTO) {
    try {
      const newActivityGroup = new ActivityGroup({
        name: activityGroupDTO.name,
        descr: activityGroupDTO.descr,
      });

      const newActivityGroupWithId = await newActivityGroup.save();

      return this.getActivityGroup(newActivityGroupWithId._id.toString());
    } catch (e) {
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  },

  async updateActivityGroup(
    activityGroupId: string,
    activityGroupDTO: ActivityGroupDTO
  ) {
    try {
      if (!(await this.existsActivityGroup(activityGroupId))) {
        throw new Error('Activity Group Not Found');
      }

      await ActivityGroup.findById(activityGroupId).updateOne({
        name: activityGroupDTO.name,
        descr: activityGroupDTO.descr,
        updatedDate: Date.now(),
      });

      return this.getActivityGroup(activityGroupId);
    } catch (e) {
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  },

  async deleteActivityGroup(activityGroupId: string) {
    try {
      if (!(await this.existsActivityGroup(activityGroupId))) {
        throw new Error('Activity Group Not Found');
      }

      const activities = await activityService.getActivitiesForActivityGroup(
        activityGroupId
      );
      if (activities && activities.length > 0) {
        await Promise.all(
          activities?.map(async (activity) => {
            if (activity) {
              if (activity._id) {
                await activityService.deleteActivity(activity._id.toString());
              }
            }
          })
        );

        await ActivityGroup.findById(activityGroupId).updateOne({
          deleted: true,
        });

        const message = {
          message: 'Deleted successful',
        };
        return message;
      }
    } catch (e) {
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  },
};