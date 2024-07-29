import Session from '../model/session.model';
import activityService from './activity.service';
import { SessionDTO, SessionUpdateDTO } from '../dto/session.dto';
import mongoose from 'mongoose';

export default {
  async getSessions(completed?: boolean) {
    try {
      let sessions;
      if (completed !== undefined) {
        sessions = await Session.find({
          deleted: false,
          completed: completed,
        }).populate('activity');
      } else {
        sessions = await Session.find({ deleted: false }).populate('activity');
      }

      return sessions;
    } catch (e) {
      console.log(e);
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  },

  async getSessionsForActivity(activityId: string, completed?: boolean) {
    try {
      if (!(await activityService.existsActivity(activityId))) {
        throw new Error('Activity For Session Not Found');
      }
      let sessions;

      if (completed !== undefined) {
        sessions = await Session.find({
          activity: activityId,
          deleted: false,
          completed: completed,
        }).exec();
      } else {
        sessions = await Session.find({
          activity: activityId,
          deleted: false,
        }).exec();
      }

      return sessions;
    } catch (e) {
      console.log(e);
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  },

  async getSession(sessionId: string) {
    try {
      if (!(await this.existsSession(sessionId))) {
        throw new Error('Session Not Found');
      }

      const session = await Session.findById(sessionId);

      if (session?.activity) {
        if (
          !(await activityService.existsActivity(
            session.activity._id.toString()
          ))
        ) {
          throw new Error('Activity For Session Not Found');
        }
      }

      return session;
    } catch (e) {
      if (e instanceof Error) {
        console.log(e.message);
        throw new Error(e.message);
      }
    }
  },

  async existsSession(sessionId: string) {
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
        !(await activityService.existsActivity(session.activity.toString()))
      ) {
        return false;
      }
    }

    return true;
  },

  async createSession(sessionDTO: SessionDTO) {
    try {
      if (sessionDTO.activity) {
        if (!(await activityService.existsActivity(sessionDTO.activity))) {
          throw new Error('Activity Not Found');
        }
      }

      const newSession = new Session({
        totalTimeSeconds: sessionDTO.totalTimeSeconds,
        spentTimeSeconds: 0,
        activity: sessionDTO.activity,
      });

      return (await newSession.save()).populate('activity');
    } catch (e) {
      console.log(e);
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  },

  async updateSession(sessionId: string, sessionDTO: SessionUpdateDTO) {
    try {
      if (!(await this.existsSession(sessionId))) {
        throw new Error('Session Not Found');
      }

      if (sessionDTO.spentTimeSeconds > sessionDTO.totalTimeSeconds) {
        throw new Error('Total time must be greater or equal spent time');
      }

      let completed = false;
      if (sessionDTO.totalTimeSeconds === sessionDTO.spentTimeSeconds) {
        completed = true;
      }

      await Session.findById(sessionId).updateOne({
        totalTimeSeconds: sessionDTO.totalTimeSeconds,
        spentTimeSeconds: sessionDTO.spentTimeSeconds,
        completed: completed,
        updatedDate: Date.now(),
      });

      return await Session.findById(sessionId);
    } catch (e) {
      console.log(e);
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  },

  async deleteSession(sessionId: string) {
    try {
      if (!(await this.existsSession(sessionId))) {
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
      console.log(e);
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  },
};
