import mongoose from 'mongoose';
import Session from '../../model/session.model';

describe('Session model validation', () => {
  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should fail if totalTimeSeconds < 1', async () => {
    const session = new Session({
      totalTimeSeconds: 0,
      spentTimeSeconds: 0,
      user: new mongoose.Types.ObjectId(),
    });

    const error = session.validateSync();
    expect(error?.errors.totalTimeSeconds).toBeDefined();
    expect(error?.errors.totalTimeSeconds.message).toBe(
      'TotalTimeSeconds should be minimum 1 second'
    );
  });

  it('should fail if totalTimeSeconds < 36000', async () => {
    const session = new Session({
      totalTimeSeconds: 36001,
      spentTimeSeconds: 0,
      user: new mongoose.Types.ObjectId(),
    });

    const error = session.validateSync();
    expect(error?.errors.totalTimeSeconds).toBeDefined();
    expect(error?.errors.totalTimeSeconds.message).toBe(
      'TotalTimeSeconds should be maximum 10 hours'
    );
  });

  it('should pass', async () => {
    const session = new Session({
      totalTimeSeconds: 3000,
      spentTimeSeconds: 0,
      user: new mongoose.Types.ObjectId(),
    });

    const error = session.validateSync();
    expect(error).toBeUndefined();
  });
});
