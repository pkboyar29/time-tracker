import Session from '../model/session.model';
import SessionPart from '../model/sessionPart.model';
import activityService from './activity.service';
import { SessionCreateDTO, SessionUpdateDTO } from '../dto/session.dto';
import mongoose from 'mongoose';
import { HttpError } from '../helpers/HttpError';

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
        throw new HttpError(404, 'Activity For Session Not Found');
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
        throw new HttpError(404, 'Session Not Found');
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
          throw new HttpError(404, 'Activity Not Found');
        }
      }

      const newSession = new Session({
        totalTimeSeconds: sessionDTO.totalTimeSeconds,
        spentTimeSeconds: 0,
        activity: sessionDTO.activity,
        user: userId,
      });

      const validationError = newSession.validateSync();
      if (validationError) {
        if (validationError.errors.totalTimeSeconds) {
          throw new HttpError(
            400,
            validationError.errors.totalTimeSeconds.toString()
          );
        }
      }

      if (sessionDTO.activity) {
        await activityService.addActivityToLastActivities(
          sessionDTO.activity,
          userId
        );
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
        throw new HttpError(404, 'Session Not Found');
      }

      if (
        Number(sessionDTO.spentTimeSeconds) >
        Number(sessionDTO.totalTimeSeconds)
      ) {
        throw new HttpError(
          400,
          'Total time must be greater or equal spent time'
        );
      }

      const session = await Session.findById(sessionId);

      if (session!.completed) {
        throw new HttpError(
          400,
          'You cannot update an already completed session'
        );
      }

      if (session!.spentTimeSeconds > sessionDTO.spentTimeSeconds) {
        throw new HttpError(
          400,
          "You cannot reduce a session's spentTimeSeconds"
        );
      }

      let partSpentTimeSeconds: number =
        sessionDTO.spentTimeSeconds - session!.spentTimeSeconds;
      const newSessionPart = new SessionPart({
        spentTimeSeconds: partSpentTimeSeconds,
        session: sessionId,
        user: userId,
        createdDate: Date.now(),
      });
      await newSessionPart.save();

      session!.totalTimeSeconds = sessionDTO.totalTimeSeconds;
      session!.spentTimeSeconds = sessionDTO.spentTimeSeconds;
      session!.note = sessionDTO.note;
      session!.completed =
        sessionDTO.totalTimeSeconds === sessionDTO.spentTimeSeconds;
      session!.updatedDate = new Date();

      const validationError = session!.validateSync();
      if (validationError) {
        const fields = [
          'totalTimeSeconds',
          'spentTimeSeconds',
          'note',
        ] as const;

        for (const field of fields) {
          const err = validationError.errors[field];
          if (err) {
            throw new HttpError(400, err.toString());
          }
        }
      }

      await session!.save();

      return await this.getSession(sessionId, userId);
    } catch (e) {
      this.handleError(e);
    }
  },

  async deleteSession(sessionId: string, userId: string) {
    try {
      if (!(await this.existsSession(sessionId, userId))) {
        throw new HttpError(404, 'Session Not Found');
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
    if (e instanceof Error || e instanceof HttpError) {
      throw e;
    }
  },
};
