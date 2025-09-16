import activityGroupService from '../../../service/activityGroup.service';
import mongoose from 'mongoose';
import ActivityGroup from '../../../model/activityGroup.model';

describe('activityGroupService.existsActvityGroup', () => {
  const mockActivityGroup = {
    _id: 'someObjectId',
    name: 'name',
    deleted: false,
    user: 'userId',
    toObject: () => this,
  };

  it('returns false if activityGroupId is not a valid ObjectId', async () => {
    const spy = jest.spyOn(mongoose.Types.ObjectId, 'isValid');

    const exists = await activityGroupService.existsActivityGroup(
      'notValidActivityGroupId',
      'user123'
    );

    expect(exists).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it('returns false if activity group is not found in database', async () => {
    jest.spyOn(ActivityGroup, 'findById').mockResolvedValue(null);

    const exists = await activityGroupService.existsActivityGroup(
      new mongoose.Types.ObjectId().toString(),
      'user123'
    );

    expect(exists).toBe(false);
  });

  it('returns false if activity group is marked as deleted', async () => {
    jest.spyOn(ActivityGroup, 'findById').mockResolvedValue({
      ...mockActivityGroup,
      deleted: true,
    });

    const exists = await activityGroupService.existsActivityGroup(
      new mongoose.Types.ObjectId().toString(),
      'user123'
    );

    expect(exists).toBe(false);
  });

  it('returns false if activity group belongs to another user', async () => {
    jest.spyOn(ActivityGroup, 'findById').mockResolvedValue(mockActivityGroup);

    const exists = await activityGroupService.existsActivityGroup(
      new mongoose.Types.ObjectId().toString(),
      'user123'
    );

    expect(exists).toBe(false);
  });

  it('returns true if activity group is valid, not deleted, and owned by user', async () => {
    jest.spyOn(ActivityGroup, 'findById').mockResolvedValue(mockActivityGroup);

    const exists = await activityGroupService.existsActivityGroup(
      new mongoose.Types.ObjectId().toString(),
      mockActivityGroup.user
    );

    expect(exists).toBe(true);
  });
});
