import Session from '../model/session.model';
import SessionPart from '../model/sessionPart.model';
import activityService from './activity.service';
import { SessionDTO, SessionUpdateDTO } from '../dto/session.dto';
import mongoose from 'mongoose';

export default {
  async getSessions(filter: Record<string, unknown> = {}) {
    try {
      let sessions;
      sessions = await Session.find({
        deleted: false,
        ...filter,
      }).populate('activity');

      return sessions;
    } catch (e) {
      this.handleError(e);
    }
  },

  async getSessionsForActivity(activityId: string, completed?: boolean) {
    try {
      if (!(await activityService.existsActivity(activityId))) {
        throw new Error('Activity For Session Not Found');
      }

      const filter: Record<string, unknown> = {
        activity: activityId,
      };
      if (completed !== undefined) {
        filter.completed = completed;
      }

      return await this.getSessions(filter);
    } catch (e) {
      this.handleError(e);
    }
  },

  async getSession(sessionId: string) {
    try {
      if (!(await this.existsSession(sessionId))) {
        throw new Error('Session Not Found');
      }

      const session = await Session.findById(sessionId).populate('activity');
      return session;
    } catch (e) {
      this.handleError(e);
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
      this.handleError(e);
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

      const session = await Session.findById(sessionId);
      if (session) {
        let partSpentTimeSeconds: number =
          sessionDTO.spentTimeSeconds - session.spentTimeSeconds;
        const newSessionPart = new SessionPart({
          spentTimeSeconds: partSpentTimeSeconds,
          session: sessionId,
          createdDate: Date.now(),
        });
        await newSessionPart.save();

        await session.updateOne({
          totalTimeSeconds: sessionDTO.totalTimeSeconds,
          spentTimeSeconds: sessionDTO.spentTimeSeconds,
          completed: completed,
          updatedDate: Date.now(),
        });
      }

      return await this.getSession(sessionId);
    } catch (e) {
      console.log('trigger 3');
      this.handleError(e);
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
      this.handleError(e);
    }
  },

  handleError(e: unknown) {
    if (e instanceof Error) {
      throw new Error(e.message);
    }
  },
};
