import mongoose from 'mongoose';
import Session from '../../../model/session.model';

describe('Session model validation', () => {
  it('should fail if totalSeconds < 1', async () => {
    const session = new Session({
      totalSeconds: 0,
      spentSeconds: 0,
      user: new mongoose.Types.ObjectId(),
    });

    const error = session.validateSync();
    expect(error?.errors.totalSeconds).toBeDefined();
    expect(error?.errors.totalSeconds.message).toBe('totalSeconds should be minimum 1 second');
  });

  it('should fail if totalSeconds < 36000', async () => {
    const session = new Session({
      totalSeconds: 36001,
      spentSeconds: 0,
      user: new mongoose.Types.ObjectId(),
    });

    const error = session.validateSync();
    expect(error?.errors.totalSeconds).toBeDefined();
    expect(error?.errors.totalSeconds.message).toBe('totalSeconds should be maximum 10 hours');
  });

  it('should pass', async () => {
    const session = new Session({
      totalSeconds: 3000,
      spentSeconds: 0,
      user: new mongoose.Types.ObjectId(),
    });

    const error = session.validateSync();
    expect(error).toBeUndefined();
  });
});
