import sessionService from '../../../service/session.service';
import activityService from '../../../service/activity.service';
import { Types, HydratedDocument } from 'mongoose';
import Session, { ISession } from '../../../model/session.model';
import SessionPart from '../../../model/sessionPart.model';
import { HttpError } from '../../../helpers/HttpError';

describe('sessionService.getSession', () => {
  const mockSession = {
    _id: 'someObjectId',
    totalTimeSeconds: 3600,
    spentTimeSeconds: 600,
    deleted: false,
    user: 'userId',
    toObject: () => this,
  };

  it('throws error if sessionId is not a valid ObjectId', async () => {
    const spy = jest.spyOn(Types.ObjectId, 'isValid');

    try {
      await sessionService.getSession('notValidSessionId', 'user123');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
    }

    expect(spy).toHaveBeenCalled();
  });

  it('throws error if session is not found in database', async () => {
    jest.spyOn(Session, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    } as any);

    try {
      await sessionService.getSession(
        new Types.ObjectId().toString(),
        'user123'
      );
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
    }
  });

  it('throws error if session is marked as deleted', async () => {
    jest.spyOn(Session, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({
        ...mockSession,
        user: 'user123',
        deleted: true,
      }),
    } as any);

    try {
      await sessionService.getSession(
        new Types.ObjectId().toString(),
        'user123'
      );
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
    }
  });

  it('throws error if session belongs to another user', async () => {
    jest.spyOn(Session, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockSession),
    } as any);

    try {
      await sessionService.getSession(
        new Types.ObjectId().toString(),
        'user123'
      );
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
    }
  });

  it('returns mock session if session is valid, not deleted, and owned by user', async () => {
    jest.spyOn(Session, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockSession),
    } as any);

    const session = await sessionService.getSession(
      new Types.ObjectId().toString(),
      mockSession.user
    );

    expect(session).toBe(mockSession);
  });
});

describe('sessionService.createSession', () => {
  const userId = 'user123';
  const mockSessionDTO = {
    totalTimeSeconds: 60,
    activity: 'activity123',
  };

  it('should throw error if activity not found', async () => {
    jest
      .spyOn(activityService, 'getActivity')
      .mockRejectedValue(new HttpError(404, 'Activity Not Found'));

    await expect(
      sessionService.createSession(mockSessionDTO, userId)
    ).rejects.toThrow('Activity Not Found');
  });
});

describe('sessionService.updateSession', () => {
  const mockSession: HydratedDocument<ISession> = {
    _id: new Types.ObjectId('652fcb3f0000000000000001'),
    totalTimeSeconds: 3600,
    spentTimeSeconds: 600,
    note: 'Focus session on project A',
    completed: false,
    activity: { name: 'Coding' },
    user: new Types.ObjectId('652fcb3f0000000000000002'),
    createdDate: new Date('2025-10-19T10:00:00Z'),
    updatedDate: new Date('2025-10-19T10:30:00Z'),
    deleted: false,
    // toObject: jest.fn().mockImplementation(function () {
    //   return { ...this };
    // }),
    save: jest.fn(),
    populate: jest.fn().mockResolvedValue(this),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  } as unknown as HydratedDocument<ISession>;

  it('should throw 404 if session does not exist', async () => {
    jest
      .spyOn(sessionService, 'getSession')
      .mockRejectedValue(new HttpError(404, 'Session Not Found'));

    try {
      await sessionService.updateSession(
        'sessionId',
        { spentTimeSeconds: 10, totalTimeSeconds: 20, note: 'note' },
        'userId'
      );
    } catch (e) {
      if (e instanceof HttpError) {
        expect(e.status).toBe(404);
      }
    }
  });

  it('should throw 400 if spentTimeSeconds > totalTimeSeconds', async () => {
    jest.spyOn(sessionService, 'getSession').mockResolvedValue(mockSession);

    try {
      await sessionService.updateSession(
        'sessionId',
        { spentTimeSeconds: 30, totalTimeSeconds: 20, note: 'note' },
        'userId'
      );
    } catch (e) {
      if (e instanceof HttpError) {
        expect(e.status).toBe(400);
        expect(e.message).toBe(
          'Total time must be greater or equal spent time'
        );
      }
    }
  });

  it('should throw 400 if session is already completed', async () => {
    jest.spyOn(sessionService, 'getSession').mockResolvedValue({
      ...mockSession,
      completed: true,
    } as any);

    try {
      await sessionService.updateSession(
        'sessionId',
        { spentTimeSeconds: 10, totalTimeSeconds: 20, note: 'note' },
        'userId'
      );
    } catch (e) {
      if (e instanceof HttpError) {
        expect(e.status).toBe(400);
        expect(e.message).toBe(
          'You cannot update an already completed session'
        );
      }
    }
  });

  it('should throw 400 if trying to reduce spentTimeSeconds', async () => {
    jest.spyOn(sessionService, 'getSession').mockResolvedValue({
      ...mockSession,
      completed: false,
      spentTimeSeconds: 20,
    } as any);

    try {
      await sessionService.updateSession(
        'sessionId',
        { spentTimeSeconds: 10, totalTimeSeconds: 30, note: 'note' },
        'userId'
      );
    } catch (e) {
      if (e instanceof HttpError) {
        expect(e.status).toBe(400);
        expect(e.message).toBe(
          "You cannot reduce a session's spentTimeSeconds"
        );
      }
    }
  });

  it('should create a new SessionPart and update session', async () => {
    const sessionMock = {
      completed: false,
      spentTimeSeconds: 10,
      totalTimeSeconds: 20,
      note: 'old note',
      validateSync: jest.fn().mockReturnValue(undefined),
      save: jest.fn().mockResolvedValue(true),
    };

    jest
      .spyOn(sessionService, 'getSession')
      .mockResolvedValue(sessionMock as any);

    const saveSpy = jest
      .spyOn(SessionPart.prototype, 'save')
      .mockResolvedValue(true);

    await sessionService.updateSession(
      'sessionId',
      { spentTimeSeconds: 15, totalTimeSeconds: 25, note: 'new note' },
      'userId'
    );

    expect(saveSpy).toHaveBeenCalled();
    expect(sessionMock.spentTimeSeconds).toBe(15);
    expect(sessionMock.totalTimeSeconds).toBe(25);
    expect(sessionMock.note).toBe('new note');
  });
});
