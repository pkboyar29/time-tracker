import userService from '../../../service/user.service';
import analyticsService from '../../../service/analytics.service';
import { Types } from 'mongoose';

const mockAggregate = {
  _id: new Types.ObjectId(),
  date: '',
  user: new Types.ObjectId(),
  spentTimeSeconds: 0,
  sessionsAmount: 0,
  pausedAmount: 0,
};

describe('userService.isDailyGoalCompleted', () => {
  it('returns true if today seconds is equal to daily goal', async () => {
    jest
      .spyOn(analyticsService, 'getTodayAggregate')
      .mockResolvedValue({ ...mockAggregate, spentSeconds: 120 });

    const result = await userService.isDailyGoalCompleted(120, '', '');
    expect(result).toBe(true);
  });

  it('returns true if today seconds is more than daily goal', async () => {
    jest
      .spyOn(analyticsService, 'getTodayAggregate')
      .mockResolvedValue({ ...mockAggregate, spentSeconds: 121 });

    const result = await userService.isDailyGoalCompleted(120, '', '');
    expect(result).toBe(true);
  });

  it('returns false if today seconds is less than daily goal', async () => {
    jest
      .spyOn(analyticsService, 'getTodayAggregate')
      .mockResolvedValue({ ...mockAggregate, spentSeconds: 119 });

    const result = await userService.isDailyGoalCompleted(120, '', '');
    expect(result).toBe(false);
  });
});

describe('userService.isDailyGoalCompletedNow', () => {
  it('returns false if daily goal was reached before', async () => {
    jest
      .spyOn(analyticsService, 'getTodayAggregate')
      .mockResolvedValue({ ...mockAggregate, spentSeconds: 200 });

    const result = await userService.isDailyGoalCompletedNow(10, 120, '', '');
    expect(result).toBe(false);
  });

  it('returns false if daily goal is not reached yet', async () => {
    jest
      .spyOn(analyticsService, 'getTodayAggregate')
      .mockResolvedValue({ ...mockAggregate, spentSeconds: 60 });

    const result = await userService.isDailyGoalCompletedNow(10, 120, '', '');
    expect(result).toBe(false);
  });

  it('returns true if daily goal is reached now', async () => {
    jest
      .spyOn(analyticsService, 'getTodayAggregate')
      .mockResolvedValue({ ...mockAggregate, spentSeconds: 129 });

    const result = await userService.isDailyGoalCompletedNow(10, 120, '', '');
    expect(result).toBe(true);
  });
});
