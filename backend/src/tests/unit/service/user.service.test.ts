import userService from '../../../service/user.service';
import sessionPartService from '../../../service/sessionPart.service';

describe('userService.isDailyGoalCompleted', () => {
  it('returns true if today seconds is equal to daily goal', async () => {
    jest
      .spyOn(sessionPartService, 'getSpentTimeSecondsInDateRange')
      .mockResolvedValue(120);

    const result = await userService.isDailyGoalCompleted(120, '', '');
    expect(result).toBe(true);
  });

  it('returns true if today seconds is more than daily goal', async () => {
    jest
      .spyOn(sessionPartService, 'getSpentTimeSecondsInDateRange')
      .mockResolvedValue(121);

    const result = await userService.isDailyGoalCompleted(120, '', '');
    expect(result).toBe(true);
  });

  it('returns false if today seconds is less than daily goal', async () => {
    jest
      .spyOn(sessionPartService, 'getSpentTimeSecondsInDateRange')
      .mockResolvedValue(119);

    const result = await userService.isDailyGoalCompleted(120, '', '');
    expect(result).toBe(false);
  });
});

describe('userService.isDailyGoalCompletedNow', () => {
  it('returns false if daily goal was reached before', async () => {
    jest
      .spyOn(sessionPartService, 'getSpentTimeSecondsInDateRange')
      .mockResolvedValue(200);

    const result = await userService.isDailyGoalCompletedNow(10, 120, '', '');
    expect(result).toBe(false);
  });

  it('returns false if daily goal is not reached yet', async () => {
    jest
      .spyOn(sessionPartService, 'getSpentTimeSecondsInDateRange')
      .mockResolvedValue(60);

    const result = await userService.isDailyGoalCompletedNow(10, 120, '', '');
    expect(result).toBe(false);
  });

  it('returns true if daily goal is reached now', async () => {
    jest
      .spyOn(sessionPartService, 'getSpentTimeSecondsInDateRange')
      .mockResolvedValue(129);

    const result = await userService.isDailyGoalCompletedNow(10, 120, '', '');
    expect(result).toBe(true);
  });
});
