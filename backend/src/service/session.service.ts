import Session from '../model/session.model';
import SessionPart from '../model/sessionPart.model';
import UserTopActivity from '../model/userTopActivity.model';
import activityService from './activity.service';
import { SessionCreateDTO, SessionUpdateDTO } from '../dto/session.dto';
import mongoose from 'mongoose';

interface PopulatedActivity {
  name: string;
}

const activityPopulateConfig = {
  path: 'activity',
  select: 'name activityGroup -_id',
  populate: {
    path: 'activityGroup',
    select: 'name -_id',
  },
};

export default {
  async getSessions(filter: Record<string, unknown> = {}, userId: string) {
    try {
      const sessions = await Session.find({
        deleted: false,
        user: userId,
        ...filter,
      }).populate<{ activity: PopulatedActivity }>(activityPopulateConfig);

      return sessions;
    } catch (e) {
      this.handleError(e);
    }
  },

  async getSessionsForActivity(
    activityId: string,
    userId: string,
    completed?: boolean
  ) {
    try {
      if (!(await activityService.existsActivity(activityId, userId))) {
        throw new Error('Activity For Session Not Found');
      }

      const filter: Record<string, unknown> = {
        activity: activityId,
      };
      if (completed !== undefined) {
        filter.completed = completed;
      }

      return await this.getSessions(filter, userId);
    } catch (e) {
      this.handleError(e);
    }
  },

  async getSession(sessionId: string, userId: string) {
    try {
      if (!(await this.existsSession(sessionId, userId))) {
        throw new Error('Session Not Found');
      }

      return await Session.findById(sessionId).populate<{
        activity: PopulatedActivity;
      }>(activityPopulateConfig);
    } catch (e) {
      this.handleError(e);
    }
  },

  async existsSession(sessionId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return false;
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return false;
    }

    if (session.deleted) {
      return false;
    }

    if (session.activity) {
      if (
        !(await activityService.existsActivity(
          session.activity.toString(),
          userId
        ))
      ) {
        return false;
      }
    }

    if (session.user.toString() !== userId) {
      return false;
    }

    return true;
  },

  async createSession(sessionDTO: SessionCreateDTO, userId: string) {
    try {
      if (sessionDTO.activity) {
        if (
          !(await activityService.existsActivity(sessionDTO.activity, userId))
        ) {
          // TODO: возвращать HttpError
          throw new Error('Activity Not Found');
        }
      }

      // TODO: возвращать валидационные ошибки с 400 кодом

      const newSession = new Session({
        totalTimeSeconds: sessionDTO.totalTimeSeconds,
        spentTimeSeconds: 0,
        activity: sessionDTO.activity,
        user: userId,
      });

      // TODO: надо поддерживать максимум 5 элементов атомарно (использовать атомарный вариант с upsert)
      if (sessionDTO.activity) {
        const userTopActivities = await UserTopActivity.find({ userId }).sort({
          createdDate: 1,
        });

        const isActivityInUserTop = userTopActivities.find((topActivity) =>
          topActivity.activityId.equals(sessionDTO.activity)
        );
        if (!isActivityInUserTop) {
          if (userTopActivities.length == 5) {
            await userTopActivities[0].deleteOne();
          }

          await new UserTopActivity({
            userId,
            activityId: sessionDTO.activity,
            createdDate: new Date(),
          }).save();
        }
      }

      return (await newSession.save()).populate(activityPopulateConfig);
    } catch (e) {
      this.handleError(e);
    }
  },

  async updateSession(
    sessionId: string,
    sessionDTO: SessionUpdateDTO,
    userId: string
  ) {
    try {
      if (!(await this.existsSession(sessionId, userId))) {
        throw new Error('Session Not Found');
      }

      if (sessionDTO.note && sessionDTO.note.length > 1600) {
        throw new Error(
          'Note is too long. Maximum allowed length is 1600 characters'
        );
      }

      if (sessionDTO.spentTimeSeconds > sessionDTO.totalTimeSeconds) {
        throw new Error('Total time must be greater or equal spent time');
      }

      let completed: boolean = false;
      if (sessionDTO.totalTimeSeconds === sessionDTO.spentTimeSeconds) {
        completed = true;
      }

      const session = await Session.findById(sessionId);
      if (session) {
        let partSpentTimeSeconds: number =
          sessionDTO.spentTimeSeconds - session.spentTimeSeconds;
        const newSessionPart = new SessionPart({
          spentTimeSeconds: partSpentTimeSeconds,
          session: sessionId,
          user: userId,
          createdDate: Date.now(),
        });
        await newSessionPart.save();

        await session.updateOne({
          totalTimeSeconds: sessionDTO.totalTimeSeconds,
          spentTimeSeconds: sessionDTO.spentTimeSeconds,
          note: sessionDTO.note,
          completed: completed,
          updatedDate: Date.now(),
        });
      }

      return await this.getSession(sessionId, userId);
    } catch (e) {
      this.handleError(e);
    }
  },

  async deleteSession(sessionId: string, userId: string) {
    try {
      if (!(await this.existsSession(sessionId, userId))) {
        throw new Error('Session Not Found');
      }

      await Session.findById(sessionId).updateOne({
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
    if (e instanceof Error) {
      throw new Error(e.message);
    }
  },
};
