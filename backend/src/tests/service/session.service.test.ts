import sessionService from '../../service/session.service';
import activityService from '../../service/activity.service';
import mongoose from 'mongoose';
import Session from '../../model/session.model';
import SessionPart from '../../model/sessionPart.model';
import { HttpError } from '../../helpers/HttpError';

describe('sessionService.existsSession', () => {
  const mockSession = {
    _id: 'someObjectId',
    totalTimeSeconds: 3600,
    spentTimeSeconds: 600,
    deleted: false,
    user: 'userId',
    toObject: () => this,
  };

  it('returns false if sessionId is not a valid ObjectId', async () => {
    const spy = jest.spyOn(mongoose.Types.ObjectId, 'isValid');

    const exists = await sessionService.existsSession(
      'notValidSessionId',
      'user123'
    );

    expect(exists).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it('returns false if session is not found in database', async () => {
    jest.spyOn(Session, 'findById').mockResolvedValue(null);

    const exists = await sessionService.existsSession(
      new mongoose.Types.ObjectId().toString(),
      'user123'
    );

    expect(exists).toBe(false);
  });

  it('returns false if session is marked as deleted', async () => {
    jest.spyOn(Session, 'findById').mockResolvedValue({
      ...mockSession,
      deleted: true,
    });

    const exists = await sessionService.existsSession(
      new mongoose.Types.ObjectId().toString(),
      'user123'
    );

    expect(exists).toBe(false);
  });

  it('returns false if session belongs to another user', async () => {
    jest.spyOn(Session, 'findById').mockResolvedValue(mockSession);

    const exists = await sessionService.existsSession(
      new mongoose.Types.ObjectId().toString(),
      'user123'
    );

    expect(exists).toBe(false);
  });

  it('returns false if related activity is not found for user', async () => {
    jest.spyOn(Session, 'findById').mockResolvedValue({
      ...mockSession,
      activity: new mongoose.Types.ObjectId(),
    });
    jest.spyOn(activityService, 'existsActivity').mockResolvedValue(false);

    const exists = await sessionService.existsSession(
      new mongoose.Types.ObjectId().toString(),
      'user123'
    );

    expect(exists).toBe(false);
  });

  it('returns true if session is valid, not deleted, and owned by user', async () => {
    jest.spyOn(Session, 'findById').mockResolvedValue(mockSession);

    const exists = await sessionService.existsSession(
      new mongoose.Types.ObjectId().toString(),
      mockSession.user
    );

    expect(exists).toBe(true);
  });
});

describe('sessionService.createSession', () => {
  const userId = 'user123';
  const mockSessionDTO = {
    totalTimeSeconds: 60,
    activity: 'activity123',
  };

  it('should throw error if activity not found', async () => {
    jest.spyOn(activityService, 'existsActivity').mockResolvedValue(false);

    await expect(
      sessionService.createSession(mockSessionDTO, userId)
    ).rejects.toThrow('Activity Not Found');
  });
});

describe('sessionService.updateSession', () => {
  it('should throw 404 if session does not exist', async () => {
    jest.spyOn(sessionService, 'existsSession').mockResolvedValue(false);

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
    jest.spyOn(sessionService, 'existsSession').mockResolvedValue(true);

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
    jest.spyOn(sessionService, 'existsSession').mockResolvedValue(true);
    jest.spyOn(Session, 'findById').mockResolvedValue({
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
    jest.spyOn(sessionService, 'existsSession').mockResolvedValue(true);
    jest.spyOn(Session, 'findById').mockResolvedValue({
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
    jest.spyOn(sessionService, 'existsSession').mockResolvedValue(true);
    const sessionMock: any = {
      completed: false,
      spentTimeSeconds: 10,
      totalTimeSeconds: 20,
      note: 'old note',
      validateSync: jest.fn().mockReturnValue(undefined),
      save: jest.fn().mockResolvedValue(true),
    };
    jest.spyOn(Session, 'findById').mockResolvedValue(sessionMock);
    const saveSpy = jest
      .spyOn(SessionPart.prototype, 'save')
      .mockResolvedValue(true);
    jest
      .spyOn(sessionService, 'getSession')
      .mockResolvedValue('finalResult' as any);

    const result = await sessionService.updateSession(
      'sessionId',
      { spentTimeSeconds: 15, totalTimeSeconds: 25, note: 'new note' },
      'userId'
    );

    expect(saveSpy).toHaveBeenCalled();
    expect(sessionMock.spentTimeSeconds).toBe(15);
    expect(sessionMock.totalTimeSeconds).toBe(25);
    expect(sessionMock.note).toBe('new note');
    expect(result).toBe('finalResult');
  });
});
