import activityService from '../../service/activity.service';
import mongoose from 'mongoose';
import Activity from '../../model/activity.model';

describe('activityService.existsActivity', () => {
  const mockActivity = {
    _id: 'someObjectId',
    name: 'name',
    activityGroup: 'someObjectIdd',
    deleted: false,
    user: 'userId',
    toObject: () => this,
  };

  it('returns false if activityId is not a valid ObjectId', async () => {
    const spy = jest.spyOn(mongoose.Types.ObjectId, 'isValid');

    const exists = await activityService.existsActivity(
      'notValidActivityId',
      'user123'
    );

    expect(exists).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it('returns false if activity is not found in database', async () => {
    jest.spyOn(Activity, 'findById').mockResolvedValue(null);

    const exists = await activityService.existsActivity(
      new mongoose.Types.ObjectId().toString(),
      'user123'
    );

    expect(exists).toBe(false);
  });

  it('returns false if activity is marked as deleted', async () => {
    jest.spyOn(Activity, 'findById').mockResolvedValue({
      ...mockActivity,
      deleted: true,
    });

    const exists = await activityService.existsActivity(
      new mongoose.Types.ObjectId().toString(),
      'user123'
    );

    expect(exists).toBe(false);
  });

  it('returns false if activity belongs to another user', async () => {
    jest.spyOn(Activity, 'findById').mockResolvedValue(mockActivity);

    const exists = await activityService.existsActivity(
      new mongoose.Types.ObjectId().toString(),
      'user123'
    );

    expect(exists).toBe(false);
  });

  it('returns true if activity is valid, not deleted, and owned by user', async () => {
    jest.spyOn(Activity, 'findById').mockResolvedValue(mockActivity);

    const exists = await activityService.existsActivity(
      new mongoose.Types.ObjectId().toString(),
      mockActivity.user
    );

    expect(exists).toBe(true);
  });
});
