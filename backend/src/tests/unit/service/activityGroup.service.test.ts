import activityGroupService from '../../../service/activityGroup.service';
import mongoose from 'mongoose';
import ActivityGroup from '../../../model/activityGroup.model';
import { HttpError } from '../../../helpers/HttpError';

describe('activityGroupService.getActivityGroup', () => {
  const mockActivityGroup = {
    _id: 'someObjectId',
    name: 'name',
    deleted: false,
    user: 'userId',
    toObject: () => this,
  };

  it('throws error if activityGroupId is not a valid ObjectId', async () => {
    const spy = jest.spyOn(mongoose.Types.ObjectId, 'isValid');

    try {
      await activityGroupService.getActivityGroup({
        activityGroupId: 'notValidActivityGroupId',
        userId: 'user123',
      });
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      expect(spy).toHaveBeenCalled();
    }
  });

  it('throws error if activity group is not found in database', async () => {
    jest.spyOn(ActivityGroup, 'findById').mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    } as any);

    try {
      await activityGroupService.getActivityGroup({
        activityGroupId: new mongoose.Types.ObjectId().toString(),
        userId: 'user123',
      });
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
    }
  });

  it('throws error if activity group is marked as deleted', async () => {
    jest.spyOn(ActivityGroup, 'findById').mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        ...mockActivityGroup,
        deleted: true,
      }),
    } as any);

    try {
      await activityGroupService.getActivityGroup({
        activityGroupId: new mongoose.Types.ObjectId().toString(),
        userId: 'user123',
      });
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
    }
  });

  it('throws error if activity group belongs to another user', async () => {
    jest.spyOn(ActivityGroup, 'findById').mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockActivityGroup),
    } as any);

    try {
      await activityGroupService.getActivityGroup({
        activityGroupId: new mongoose.Types.ObjectId().toString(),
        userId: 'user123',
      });
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
    }
  });

  it('returns mock activity group if activity group is valid, not deleted, and owned by user', async () => {
    jest.spyOn(ActivityGroup, 'findById').mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockActivityGroup),
    } as any);

    const result = await activityGroupService.getActivityGroup({
      activityGroupId: new mongoose.Types.ObjectId().toString(),
      userId: mockActivityGroup.user,
    });

    expect(result).toBe(mockActivityGroup);
  });
});
