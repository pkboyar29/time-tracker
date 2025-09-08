import User from '../../../model/user.model';

describe('User model validation', () => {
  it('should validate a correct user', () => {
    const validUser = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'john123',
      password: 'secret',
      dailyGoal: 3600,
    });

    const error = validUser.validateSync();
    expect(error).toBeUndefined();
  });

  it('should require firstName and lastName', () => {
    const user = new User({
      email: 'john.doe@example.com',
      username: 'john123',
      password: 'secret',
      dailyGoal: 3600,
    });

    const error = user.validateSync();
    expect(error?.errors.firstName).toBeDefined();
    expect(error?.errors.lastName).toBeDefined();
  });

  it('should enforce minLength and maxLength for firstName', () => {
    const shortName = new User({
      firstName: 'A',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'john123',
      password: 'secret',
      dailyGoal: 3600,
    });
    const shortErr = shortName.validateSync();
    expect(shortErr?.errors.firstName.message).toContain('minimum length');

    const longName = new User({
      firstName: 'A'.repeat(25),
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'john123',
      password: 'secret',
      dailyGoal: 3600,
    });
    const longErr = longName.validateSync();
    expect(longErr?.errors.firstName.message).toContain('maximum length');
  });

  it('should validate email format', () => {
    const user = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'invalid-email',
      username: 'john123',
      password: 'secret',
      dailyGoal: 3600,
    });

    const error = user.validateSync();
    expect(error?.errors.email).toBeDefined();
  });

  it('should validate username pattern', () => {
    const user = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: '123john',
      password: 'secret',
      dailyGoal: 3600,
    });

    const error = user.validateSync();
    expect(error?.errors.username).toBeDefined();
  });

  it('should validate dailyGoal range', () => {
    const tooSmall = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'john123',
      password: 'secret',
      dailyGoal: 30,
    });
    const smallErr = tooSmall.validateSync();
    expect(smallErr?.errors.dailyGoal.message).toContain('minimum 60 seconds');

    const tooBig = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'john123',
      password: 'secret',
      dailyGoal: 90000,
    });
    const bigErr = tooBig.validateSync();
    expect(bigErr?.errors.dailyGoal.message).toContain('maximum 86400');
  });

  it('should set default values for showTimerInTitle and deleted', () => {
    const user = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'john123',
      password: 'secret',
      dailyGoal: 3600,
    });

    expect(user.showTimerInTitle).toBe(false);
    expect(user.deleted).toBe(false);
  });
});
