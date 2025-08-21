import mongoose from 'mongoose';
import ActivityGroup from '../../model/activityGroup.model';

describe('Activity group model validation', () => {
  it('should fail if name is missing', () => {
    const group = new ActivityGroup({
      descr: 'Some description',
      user: new mongoose.Types.ObjectId(),
    });

    const error = group.validateSync();
    expect(error?.errors.name).toBeDefined();
    expect(error?.errors.name.message).toContain('Path `name` is required');
  });

  it('should fail if name is too short', () => {
    const group = new ActivityGroup({
      name: '',
      user: new mongoose.Types.ObjectId(),
    });

    const error = group.validateSync();
    expect(error?.errors.name).toBeDefined();
    expect(error?.errors.name.message).toBe('Path `name` is required.');
  });

  it('should fail if name is too long', () => {
    const group = new ActivityGroup({
      name: 'a'.repeat(51),
      user: new mongoose.Types.ObjectId(),
    });

    const error = group.validateSync();
    expect(error?.errors.name).toBeDefined();
    expect(error?.errors.name.message).toBe(
      'Name maximum length is 50 characters'
    );
  });

  it('should fail if description is too long', () => {
    const group = new ActivityGroup({
      name: 'Valid name',
      descr: 'a'.repeat(501),
      user: new mongoose.Types.ObjectId(),
    });

    const error = group.validateSync();
    expect(error?.errors.descr).toBeDefined();
    expect(error?.errors.descr.message).toBe(
      'Description maximum length is 500 characters'
    );
  });

  it('should fail if user is missing', () => {
    const group = new ActivityGroup({
      name: 'Valid name',
    });

    const error = group.validateSync();
    expect(error?.errors.user).toBeDefined();
    expect(error?.errors.user.message).toContain('Path `user` is required');
  });

  it('should pass with valid data', () => {
    const group = new ActivityGroup({
      name: 'Valid group',
      descr: 'Optional description',
      user: new mongoose.Types.ObjectId(),
    });

    const error = group.validateSync();
    expect(error).toBeUndefined();
  });
});
