import sessionService from '../../service/session.service';
import activityService from '../../service/activity.service';
import mongoose from 'mongoose';
import Session from '../../model/session.model';

jest.mock('../../model/session.model');
jest.mock('../../service/activity.service');

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
    (Session.findById as jest.Mock).mockResolvedValue(null);

    const exists = await sessionService.existsSession(
      new mongoose.Types.ObjectId().toString(),
      'user123'
    );

    expect(exists).toBe(false);
  });

  it('returns false if session is marked as deleted', async () => {
    (Session.findById as jest.Mock).mockResolvedValue({
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
    (Session.findById as jest.Mock).mockResolvedValue(mockSession);

    const exists = await sessionService.existsSession(
      new mongoose.Types.ObjectId().toString(),
      'user123'
    );

    expect(exists).toBe(false);
  });

  it('returns false if related activity is not found for user', async () => {
    (Session.findById as jest.Mock).mockResolvedValue({
      ...mockSession,
      activity: new mongoose.Types.ObjectId(),
    });
    (activityService.existsActivity as jest.Mock).mockResolvedValue(false);

    const exists = await sessionService.existsSession(
      new mongoose.Types.ObjectId().toString(),
      'user123'
    );

    expect(exists).toBe(false);
  });

  it('returns true if session is valid, not deleted, and owned by user', async () => {
    (Session.findById as jest.Mock).mockResolvedValue(mockSession);

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

  // it('should create session if activity exists', async () => {
  //   // Arrange
  //   (activityService.existsActivity as jest.Mock).mockResolvedValue(true);

  //   const mockSave = jest.fn().mockResolvedValue({
  //     populate: jest.fn().mockResolvedValue('populated session'),
  //   });

  //   (Session as unknown as jest.Mock).mockImplementation(() => ({
  //     save: mockSave,
  //   }));

  //   // Act
  //   const result = await sessionService.createSession(mockSessionDTO, userId);

  //   // Assert
  //   expect(activityService.existsActivity).toHaveBeenCalledWith(
  //     'activity123',
  //     userId
  //   );
  //   expect(mockSave).toHaveBeenCalled();
  //   expect(result).toBe('populated session');
  // });

  it('should throw error if activity not found', async () => {
    (activityService.existsActivity as jest.Mock).mockResolvedValue(false);

    await expect(
      sessionService.createSession(mockSessionDTO, userId)
    ).rejects.toThrow('Activity Not Found');
  });
});
