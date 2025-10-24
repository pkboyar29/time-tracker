import activityService from '../../../service/activity.service';
import { Types } from 'mongoose';
import Activity from '../../../model/activity.model';
import { HttpError } from '../../../helpers/HttpError';

describe('activityService.getActivity', () => {
  const mockActivity = {
    _id: 'someObjectId',
    name: 'name',
    activityGroup: 'someObjectIdd',
    deleted: false,
    user: 'userId',
    toObject: () => this,
  };

  it('throws error if activityId is not a valid ObjectId', async () => {
    const spy = jest.spyOn(Types.ObjectId, 'isValid');

    try {
      await activityService.getActivity({
        activityId: 'notValidActivityId',
        userId: 'user123',
      });
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      expect(spy).toHaveBeenCalled();
    }
  });

  it('throws error if activity is not found in database', async () => {
    jest.spyOn(Activity, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    } as any);

    try {
      await activityService.getActivity({
        activityId: new Types.ObjectId().toString(),
        userId: 'user123',
      });
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
    }
  });

  it('throws error if activity is marked as deleted', async () => {
    jest.spyOn(Activity, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({
        ...mockActivity,
        deleted: true,
      }),
    } as any);

    try {
      await activityService.getActivity({
        activityId: new Types.ObjectId().toString(),
        userId: 'user123',
      });
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
    }
  });

  it('throws error if activity belongs to another user', async () => {
    jest.spyOn(Activity, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockActivity),
    } as any);

    try {
      await activityService.getActivity({
        activityId: new Types.ObjectId().toString(),
        userId: 'user123',
      });
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
    }
  });

  it('returns mock activity if activity is valid, not deleted, and owned by user', async () => {
    jest.spyOn(Activity, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockActivity),
    } as any);

    const result = await activityService.getActivity({
      activityId: new Types.ObjectId().toString(),
      userId: mockActivity.user,
    });

    expect(result).toBe(mockActivity);
  });
});
