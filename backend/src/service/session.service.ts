import Session, { ISession } from '../model/session.model';
import SessionPart, { ISessionPart } from '../model/sessionPart.model';
import { SessionCreateDTO, SessionUpdateDTO } from '../dto/session.dto';
import activityService from './activity.service';
import activityGroupService from './activityGroup.service';
import userService from './user.service';
import analyticsService from './analytics.service';
import mongoose from 'mongoose';
import User from '../model/user.model';
import { HttpError } from '../helpers/HttpError';

interface PopulatedActivity {
  id: mongoose.Types.ObjectId;
  name: string;
  activityGroup: {
    id: mongoose.Types.ObjectId;
    name: string;
  };
}

const activityPopulateConfig = {
  path: 'activity',
  select: 'name activityGroup id',
  populate: {
    path: 'activityGroup',
    select: 'name id',
  },
};

interface GetSessionsOptions {
  filter: Record<string, unknown>;
  userId: string;
}

interface GetSessionsForActivityOptions {
  activityId: string;
  userId: string;
  completed?: boolean;
}

const sessionService = {
  getSessions,
  getSessionsForActivity,
  getSession,
  createSession,
  updateSession,
  updateSessionNote,
  deleteSession,
};

async function getSessions({
  filter = {},
  userId,
}: GetSessionsOptions): Promise<ISession[]> {
  try {
    const sessions = await Session.find({
      deleted: false,
      user: userId,
      ...filter,
    }).populate<{ activity: PopulatedActivity }>(activityPopulateConfig);

    return sessions;
  } catch (e) {
    throw e;
  }
}

async function getSessionsForActivity({
  activityId,
  userId,
  completed,
}: GetSessionsForActivityOptions): Promise<ISession[]> {
  try {
    await activityService.getActivity({ activityId, userId });

    const filter: Record<string, unknown> = {
      activity: activityId,
    };
    if (completed !== undefined) {
      filter.completed = completed;
    }

    return await sessionService.getSessions({ filter, userId });
  } catch (e) {
    throw e;
  }
}

// TODO: добавить параметр, при котором не будет искать информацию об активности
async function getSession(
  sessionId: string,
  userId: string,
): Promise<mongoose.HydratedDocument<ISession>> {
  const notFoundError = new HttpError(404, 'Session Not Found');
  try {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw notFoundError;
    }

    const session = await Session.findById(sessionId)
      .populate<{
        activity: PopulatedActivity;
      }>(activityPopulateConfig)
      .exec();

    if (!session) {
      throw notFoundError;
    }
    if (session.user.toString() !== userId) {
      throw notFoundError;
    }
    if (session.deleted) {
      throw notFoundError;
    }

    return session;
  } catch (e) {
    throw e;
  }
}

async function createSession(
  sessionDTO: SessionCreateDTO,
  userId: string,
): Promise<ISession> {
  try {
    if (sessionDTO.activity) {
      const activity = await activityService.getActivity({
        activityId: sessionDTO.activity,
        userId,
      });
      if (activity.archived) {
        throw new HttpError(
          400,
          'Cannot create session with archived activity',
        );
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
          validationError.errors.totalTimeSeconds.toString(),
        );
      }
    }

    if (sessionDTO.activity) {
      await activityService.addActivityToLastActivities(
        sessionDTO.activity,
        userId,
      );
    }

    return (await newSession.save()).populate(activityPopulateConfig);
  } catch (e) {
    throw e;
  }
}

async function updateSession(
  sessionId: string,
  sessionDTO: SessionUpdateDTO,
  userId: string,
  timezone: string,
): Promise<ISession> {
  try {
    if (sessionDTO.spentTimeSeconds > sessionDTO.totalTimeSeconds) {
      throw new HttpError(
        400,
        'Total time must be greater or equal spent time',
      );
    }

    const session = await sessionService.getSession(sessionId, userId);
    if (session.completed) {
      throw new HttpError(
        400,
        'You cannot update an already completed session',
      );
    }
    if (sessionDTO.spentTimeSeconds < session.spentTimeSeconds) {
      throw new HttpError(
        400,
        "You cannot reduce a session's spentTimeSeconds",
      );
    }

    const now = new Date();

    let partSpentTimeSeconds = 0;
    if (sessionDTO.spentTimeSeconds > session.spentTimeSeconds) {
      partSpentTimeSeconds =
        sessionDTO.spentTimeSeconds - session.spentTimeSeconds;
      const newSessionPart = new SessionPart({
        spentTimeSeconds: partSpentTimeSeconds,
        session: sessionId,
        user: userId,
        paused: sessionDTO.isPaused,
        createdDate: now,
      });
      await newSessionPart.save();
    }

    session.totalTimeSeconds = sessionDTO.totalTimeSeconds;
    session.spentTimeSeconds = sessionDTO.spentTimeSeconds;
    session.note = sessionDTO.note;
    session.updatedDate = now;

    const validationError = session.validateSync();
    if (validationError) {
      const fields = ['totalTimeSeconds', 'spentTimeSeconds', 'note'] as const;

      for (const field of fields) {
        const err = validationError.errors[field];
        if (err) {
          throw new HttpError(400, err.toString());
        }
      }
    }

    let isCompleted = false;
    if (session.spentTimeSeconds === session.totalTimeSeconds) {
      session.completed = true;

      isCompleted = true;

      if (session.activity) {
        await activityService.updateActivityStats(
          session.activity.id.toString(),
          1,
          session.totalTimeSeconds,
          userId,
        );

        await activityGroupService.updateActivityGroupStats(
          session.activity.activityGroup.id.toString(),
          1,
          session.totalTimeSeconds,
          userId,
        );
      }
    }

    await session.save();

    await analyticsService.applySessionUpdateToAggregates({
      userId,
      timezone,
      date: now,
      addedSpentTimeSeconds: partSpentTimeSeconds,
      isPaused: sessionDTO.isPaused,
      isCompleted,
      activityId: session.activity ? session.activity.id.toString() : undefined,
    });

    const isDailyGoalCompletedMarkedToday =
      await userService.isDailyGoalCompletedMarkedToday(userId, timezone);

    if (!isDailyGoalCompletedMarkedToday) {
      const dailyGoalInfo = await User.findById(userId).select('dailyGoal');

      const isDailyGoalCompletedNow = await userService.isDailyGoalCompletedNow(
        partSpentTimeSeconds,
        dailyGoalInfo!.dailyGoal,
        userId,
        timezone,
      );
      if (isDailyGoalCompletedNow) {
        await userService.markDailyGoalCompleted(userId);

        await userService.notifyDailyGoalCompleted(userId);
      }
    }

    return session;
  } catch (e) {
    throw e;
  }
}

async function updateSessionNote(
  sessionId: string,
  note: string,
  userId: string,
): Promise<ISession> {
  try {
    const session = await sessionService.getSession(sessionId, userId);

    if (session.completed) {
      throw new HttpError(
        400,
        'You cannot update an already completed session',
      );
    }

    session.note = note;

    const validationError = session.validateSync();
    const noteError = validationError?.errors.note;
    if (noteError) {
      throw new HttpError(400, noteError.toString());
    }

    await session.save();

    return session;
  } catch (e) {
    throw e;
  }
}

// TODO: делать это атомарно
async function deleteSession(
  sessionId: string,
  userId: string,
  shouldUpdateAggregates: boolean,
): Promise<{ message: string }> {
  try {
    const session = await sessionService.getSession(sessionId, userId);

    await session.updateOne({
      deleted: true,
    });

    if (shouldUpdateAggregates) {
      const tzInfo = await User.findById(userId).select('timezone');
      const partsToDelete: ISessionPart[] = await SessionPart.find({ session });
      await analyticsService.applySessionDeleteToAggregates({
        userId,
        timezone: tzInfo!.timezone,
        deletedParts: partsToDelete,
        activityId: session.activity.id
          ? session.activity.id.toString()
          : undefined,
        completedDate: session.completed ? session.updatedDate : undefined,
      });
    }

    // TODO: В идеале инвалидировать/частично обновить только те кэш ключи, в которых даты есть в диапазоне созданных deletedParts
    await analyticsService.invalidateCache(userId);

    // TODO: удалять session parts, удалять через deleteMany? а в getSessionPartsInDateRange не фильтровать session parts среди удаленных
    return {
      message: 'Deleted successfuly',
    };
  } catch (e) {
    throw e;
  }
}

export default sessionService;
