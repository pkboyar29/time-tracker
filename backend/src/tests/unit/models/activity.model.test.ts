import mongoose from 'mongoose';
import Activity from '../../../model/activity.model';

describe('Activity model validation', () => {
  it('should fail if name is missing', () => {
    const activity = new Activity({
      descr: 'Some description',
      color: '#ffffff',
      activityGroup: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
    });

    const error = activity.validateSync();
    expect(error?.errors.name).toBeDefined();
    expect(error?.errors.name.message).toContain('Path `name` is required');
  });

  it('should fail if name is too short', () => {
    const activity = new Activity({
      name: '',
      color: '#ffffff',
      activityGroup: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
    });

    const error = activity.validateSync();
    expect(error?.errors.name).toBeDefined();
    expect(error?.errors.name.message).toBe('Path `name` is required.');
  });

  it('should fail if name is too long', () => {
    const activity = new Activity({
      name: 'a'.repeat(51),
      color: '#ffffff',
      activityGroup: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
    });

    const error = activity.validateSync();
    expect(error?.errors.name).toBeDefined();
    expect(error?.errors.name.message).toBe(
      'Name maximum length is 50 characters',
    );
  });

  it('should fail if description is too long', () => {
    const activity = new Activity({
      name: 'Valid name',
      descr: 'a'.repeat(501),
      color: '#ffffff',
      activityGroup: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
    });

    const error = activity.validateSync();
    expect(error?.errors.descr).toBeDefined();
    expect(error?.errors.descr.message).toBe(
      'Description maximum length is 500 characters',
    );
  });

  it('should fail if color is missing', () => {
    const activity = new Activity({
      name: 'Valid name',
      activityGroup: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
    });

    const error = activity.validateSync();
    expect(error?.errors.color).toBeDefined();
    expect(error?.errors.color.message).toBe('Path `color` is required.');
  });

  it('should fail if color is invalid hex', () => {
    const activity = new Activity({
      name: 'Valid name',
      color: 'ffffffe',
      activityGroup: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
    });

    const error = activity.validateSync();
    expect(error?.errors.color).toBeDefined();
    expect(error?.errors.color.message).toBe(
      'Color must be a valid HEX value (#RRGGBB or #RRGGBBAA)',
    );
  });

  it('should fail if color is too long', () => {
    const activity = new Activity({
      name: 'Valid name',
      color: '#aui23dasjsasd',
      activityGroup: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
    });

    const error = activity.validateSync();
    expect(error?.errors.color).toBeDefined();
    expect(error?.errors.color.message).toBe(
      'Color maximum length is 9 characters',
    );
  });

  it('should fail if color is too short', () => {
    const activity = new Activity({
      name: 'Valid name',
      color: '#fff',
      activityGroup: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
    });

    const error = activity.validateSync();
    expect(error?.errors.color).toBeDefined();
    expect(error?.errors.color.message).toBe(
      'Color minimum length is 7 characters',
    );
  });

  it('should fail if activityGroup is missing', () => {
    const activity = new Activity({
      name: 'Valid name',
      color: '#ffffff',
      user: new mongoose.Types.ObjectId(),
    });

    const error = activity.validateSync();
    expect(error?.errors.activityGroup).toBeDefined();
    expect(error?.errors.activityGroup.message).toContain(
      'Path `activityGroup` is required',
    );
  });

  it('should fail if user is missing', () => {
    const activity = new Activity({
      name: 'Valid name',
      color: '#ffffff',
      activityGroup: new mongoose.Types.ObjectId(),
    });

    const error = activity.validateSync();
    expect(error?.errors.user).toBeDefined();
    expect(error?.errors.user.message).toContain('Path `user` is required');
  });

  it('should pass with valid data', () => {
    const activity = new Activity({
      name: 'Valid activity',
      descr: 'Optional description',
      color: '#ffffff',
      activityGroup: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
    });

    const error = activity.validateSync();
    expect(error).toBeUndefined();
  });
});
