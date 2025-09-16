import analyticsService from '../../../service/analytics.service';
import activityService from '../../../service/activity.service';
import { IActivity } from '../../../model/activity.model';
import mongoose from 'mongoose';
import { ISessionPart } from '../../../model/sessionPart.model';
import { ISession } from '../../../model/session.model';

describe('analyticsService.getTimeBarType', () => {
  it('returns "hour" when range is exactly 1 day', () => {
    const start = new Date(2024, 6, 1); // July 1, 2024
    const end = new Date(2024, 6, 2); // July 2, 2024
    expect(analyticsService.getTimeBarType(start, end)).toBe('hour');
  });

  it('returns "day" when range is 2 days', () => {
    const start = new Date(2024, 6, 1);
    const end = new Date(2024, 6, 3);
    expect(analyticsService.getTimeBarType(start, end)).toBe('day');
  });

  it('returns "day" when range is exactly 31 days', () => {
    const start = new Date(2024, 0, 1); // Jan 1
    const end = new Date(2024, 1, 1); // Feb 1
    expect(analyticsService.getTimeBarType(start, end)).toBe('day');
  });

  it('returns "month" when range is more than 31 days', () => {
    const start = new Date(2024, 0, 1); // Jan 1
    const end = new Date(2024, 2, 5); // Mar 5 (~64 days)
    expect(analyticsService.getTimeBarType(start, end)).toBe('month');
  });

  it('rounds up partial days to the next full day (ceil behavior)', () => {
    const start = new Date(2024, 6, 1, 0, 0, 0); // July 1 00:00
    const end = new Date(2024, 6, 1, 12, 0, 0); // July 1 12:00 (12 hours)
    expect(analyticsService.getTimeBarType(start, end)).toBe('hour'); // Still 1 day (ceil → 1)
  });

  it('returns "hour" for exactly 24 hours range', () => {
    const start = new Date('2024-07-01T08:00:00Z');
    const end = new Date('2024-07-02T08:00:00Z');
    expect(analyticsService.getTimeBarType(start, end)).toBe('hour');
  });

  it('returns "year" when range is more than 732 days (2 full years)', () => {
    const start = new Date(2020, 0, 1); // Jan 1, 2020
    const end = new Date(2022, 1, 2); // Feb 2, 2022 (~763 days)
    expect(analyticsService.getTimeBarType(start, end)).toBe('year');
  });

  it('returns "month" when range is exactly 732 days', () => {
    const start = new Date(2020, 0, 1); // Jan 1, 2020
    const end = new Date(2022, 0, 2); // Jan 2, 2022 (732 days incl. leap year)
    expect(analyticsService.getTimeBarType(start, end)).toBe('month');
  });

  it('returns "year" when range is far more than 2 years', () => {
    const start = new Date(2019, 0, 1);
    const end = new Date(2023, 0, 1); // 4 years = 1461 days (incl. 1 leap year)
    expect(analyticsService.getTimeBarType(start, end)).toBe('year');
  });
});

describe('analyticsService.getTimeBars', () => {
  const sessionParts: ISessionPart[] = [
    {
      _id: new mongoose.Types.ObjectId(),
      session: { activity: { name: 'Reading' } },
      spentTimeSeconds: 1200,
      createdDate: new Date('2025-07-01T10:00:00Z'),
      user: new mongoose.Types.ObjectId(),
    },
    {
      _id: new mongoose.Types.ObjectId(),
      session: { activity: { name: 'Reading' } },
      spentTimeSeconds: 600,
      createdDate: new Date('2025-07-01T12:00:00Z'),
      user: new mongoose.Types.ObjectId(),
    },
    {
      _id: new mongoose.Types.ObjectId(),
      session: { activity: { name: 'Reading' } },
      spentTimeSeconds: 900,
      createdDate: new Date('2025-07-02T09:00:00Z'),
      user: new mongoose.Types.ObjectId(),
    },
  ];

  const completedSessions: ISession[] = [
    {
      _id: new mongoose.Types.ObjectId(),
      activity: { name: 'Reading' },
      totalTimeSeconds: 0,
      spentTimeSeconds: 0,
      completed: false,
      user: new mongoose.Types.ObjectId(),
      createdDate: new Date(),
      updatedDate: new Date('2025-07-01T13:00:00Z'),
      deleted: false,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      activity: { name: 'Reading' },
      totalTimeSeconds: 0,
      spentTimeSeconds: 0,
      completed: false,
      user: new mongoose.Types.ObjectId(),
      createdDate: new Date(),
      updatedDate: new Date('2025-07-02T14:00:00Z'),
      deleted: false,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      activity: { name: 'Reading' },
      totalTimeSeconds: 0,
      spentTimeSeconds: 0,
      completed: false,
      user: new mongoose.Types.ObjectId(),
      createdDate: new Date(),
      updatedDate: new Date('2025-07-02T15:00:00Z'),
      deleted: false,
    },
  ];
  it('should return correct day-based time bars', () => {
    const start = new Date('2025-07-01T00:00:00Z');
    const end = new Date('2025-07-03T00:00:00Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      sessionParts,
      completedSessions,
      barType: 'day',
      timezone: 'UTC',
    });

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      startOfRange: new Date('2025-07-01T00:00:00Z'),
      endOfRange: new Date('2025-07-02T00:00:00Z'),
      spentTimeSeconds: 1800,
      sessionsAmount: 1,
    });

    expect(result[1]).toEqual({
      startOfRange: new Date('2025-07-02T00:00:00Z'),
      endOfRange: new Date('2025-07-03T00:00:00Z'),
      spentTimeSeconds: 900,
      sessionsAmount: 2,
    });
  });

  it('should return correct day-based time bars and cut last period to end of range', () => {
    const start = new Date('2025-07-01T00:00:00Z');
    const end = new Date('2025-07-02T18:00:00Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      sessionParts,
      completedSessions,
      barType: 'day',
      timezone: 'UTC',
    });

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      startOfRange: new Date('2025-07-01T00:00:00Z'),
      endOfRange: new Date('2025-07-02T00:00:00Z'),
      spentTimeSeconds: 1800,
      sessionsAmount: 1,
    });

    expect(result[1]).toEqual({
      startOfRange: new Date('2025-07-02T00:00:00Z'),
      endOfRange: new Date('2025-07-02T18:00:00Z'),
      spentTimeSeconds: 900,
      sessionsAmount: 2,
    });
  });

  it('should split time bars correctly when range starts mid-day', () => {
    const start = new Date('2025-07-01T12:00:00Z');
    const end = new Date('2025-07-03T00:00:00Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      sessionParts,
      completedSessions,
      barType: 'day',
      timezone: 'UTC',
    });

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      startOfRange: new Date('2025-07-01T12:00:00Z'),
      endOfRange: new Date('2025-07-02T00:00:00Z'),
      spentTimeSeconds: 600,
      sessionsAmount: 1,
    });

    expect(result[1]).toEqual({
      startOfRange: new Date('2025-07-02T00:00:00Z'),
      endOfRange: new Date('2025-07-03T00:00:00Z'),
      spentTimeSeconds: 900,
      sessionsAmount: 2,
    });
  });

  it('should return correct month-based time bars', () => {
    const start = new Date('2025-07-01T00:00:00Z');
    const end = new Date('2025-09-01T00:00:00Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      sessionParts,
      completedSessions,
      barType: 'month',
      timezone: 'UTC',
    });

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      startOfRange: new Date('2025-07-01T00:00:00Z'),
      endOfRange: new Date('2025-08-01T00:00:00Z'),
      spentTimeSeconds: 2700,
      sessionsAmount: 3,
    });

    expect(result[1]).toEqual({
      startOfRange: new Date('2025-08-01T00:00:00Z'),
      endOfRange: new Date('2025-09-01T00:00:00Z'),
      spentTimeSeconds: 0,
      sessionsAmount: 0,
    });
  });

  it('should return correct month-based time bars and cut last period to end of range', () => {
    const start = new Date('2025-07-01T00:00:00Z');
    const end = new Date('2025-08-10T00:00:00Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      sessionParts,
      completedSessions,
      barType: 'month',
      timezone: 'UTC',
    });

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      startOfRange: new Date('2025-07-01T00:00:00Z'),
      endOfRange: new Date('2025-08-01T00:00:00Z'),
      spentTimeSeconds: 2700,
      sessionsAmount: 3,
    });

    expect(result[1]).toEqual({
      startOfRange: new Date('2025-08-01T00:00:00Z'),
      endOfRange: new Date('2025-08-10T00:00:00Z'),
      spentTimeSeconds: 0,
      sessionsAmount: 0,
    });
  });

  it('should split month time bars correctly when range starts mid-month', () => {
    const start = new Date('2025-05-10T12:00:00Z');
    const end = new Date('2025-07-01T00:00:00Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      sessionParts,
      completedSessions,
      barType: 'month',
      timezone: 'UTC',
    });

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      startOfRange: new Date('2025-05-10T12:00:00Z'),
      endOfRange: new Date('2025-06-01T00:00:00Z'),
      spentTimeSeconds: 0,
      sessionsAmount: 0,
    });

    expect(result[1]).toEqual({
      startOfRange: new Date('2025-06-01T00:00:00Z'),
      endOfRange: new Date('2025-07-01T00:00:00Z'),
      spentTimeSeconds: 0,
      sessionsAmount: 0,
    });
  });
});

describe('analyticsService.getActivityDistributions', () => {
  const mockActivities: IActivity[] = [
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Reading',
      user: new mongoose.Types.ObjectId(),
      activityGroup: new mongoose.Types.ObjectId(),
      createdDate: new Date(),
      updatedDate: new Date(),
      deleted: false,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Coding',
      user: new mongoose.Types.ObjectId(),
      activityGroup: new mongoose.Types.ObjectId(),
      createdDate: new Date(),
      updatedDate: new Date(),
      deleted: false,
    },
  ];

  it('should return correct distribution when sessions and sessionParts match activities', async () => {
    jest
      .spyOn(activityService, 'getActivities')
      .mockResolvedValue(mockActivities);

    const completedSessions: ISession[] = [
      {
        _id: new mongoose.Types.ObjectId(),
        activity: { name: 'Reading' },
        totalTimeSeconds: 0,
        spentTimeSeconds: 0,
        completed: false,
        user: new mongoose.Types.ObjectId(),
        createdDate: new Date(),
        updatedDate: new Date(),
        deleted: false,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        activity: { name: 'Reading' },
        totalTimeSeconds: 0,
        spentTimeSeconds: 0,
        completed: false,
        user: new mongoose.Types.ObjectId(),
        createdDate: new Date(),
        updatedDate: new Date(),
        deleted: false,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        activity: { name: 'Coding' },
        totalTimeSeconds: 0,
        spentTimeSeconds: 0,
        completed: false,
        user: new mongoose.Types.ObjectId(),
        createdDate: new Date(),
        updatedDate: new Date(),
        deleted: false,
      },
    ];

    const sessionParts: ISessionPart[] = [
      {
        _id: new mongoose.Types.ObjectId(),
        session: { activity: { name: 'Reading' } },
        spentTimeSeconds: 100,
        createdDate: new Date(),
        user: new mongoose.Types.ObjectId(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        session: { activity: { name: 'Coding' } },
        spentTimeSeconds: 200,
        createdDate: new Date(),
        user: new mongoose.Types.ObjectId(),
      },
    ];

    const result = await analyticsService.getActivityDistributions({
      allSessionsAmount: 4,
      allSpentTimeSeconds: 400,
      sessionParts,
      completedSessions,
      userId: 'user123',
    });

    expect(result).toEqual([
      {
        activityName: 'Reading',
        sessionsAmount: 2,
        spentTimeSeconds: 100,
      },
      {
        activityName: 'Coding',
        sessionsAmount: 1,
        spentTimeSeconds: 200,
      },
      {
        activityName: 'Without activity',
        sessionsAmount: 1, // 4 - 3
        spentTimeSeconds: 100, // 400 - (100+200)
      },
    ]);
  });

  it('should not add "Without activity" if time and sessions match exactly', async () => {
    jest
      .spyOn(activityService, 'getActivities')
      .mockResolvedValue(mockActivities);

    const completedSessions: ISession[] = [
      {
        _id: new mongoose.Types.ObjectId(),
        activity: { name: 'Reading' },
        totalTimeSeconds: 0,
        spentTimeSeconds: 0,
        completed: false,
        user: new mongoose.Types.ObjectId(),
        createdDate: new Date(),
        updatedDate: new Date(),
        deleted: false,
      },
    ];

    const sessionParts: ISessionPart[] = [
      {
        _id: new mongoose.Types.ObjectId(),
        session: { activity: { name: 'Reading' } },
        spentTimeSeconds: 300,
        createdDate: new Date(),
        user: new mongoose.Types.ObjectId(),
      },
    ];

    const result = await analyticsService.getActivityDistributions({
      allSessionsAmount: 1,
      allSpentTimeSeconds: 300,
      sessionParts,
      completedSessions,
      userId: 'user123',
    });

    expect(result).toHaveLength(1); // only one activity - reading, even if there are many activities returned in getActivities

    expect(result).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ activityName: 'Without activity' }),
      ])
    );
  });
});
