import analyticsService from '../../service/analytics.service';
import activityService from '../../service/activity.service';

jest.mock('../../service/activity.service');

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
  const sessionParts = [
    {
      createdDate: new Date('2025-07-01T10:00:00Z'),
      spentTimeSeconds: 1200,
    },
    {
      createdDate: new Date('2025-07-01T12:00:00Z'),
      spentTimeSeconds: 600,
    },
    {
      createdDate: new Date('2025-07-02T09:00:00Z'),
      spentTimeSeconds: 900,
    },
  ];

  const completedSessions = [
    {
      updatedDate: new Date('2025-07-01T13:00:00Z'),
    },
    {
      updatedDate: new Date('2025-07-02T14:00:00Z'),
    },
    {
      updatedDate: new Date('2025-07-02T15:00:00Z'),
    },
  ];
  it('should return correct day-based time bars', () => {
    const start = new Date('2025-07-01T00:00:00Z');
    const end = new Date('2025-07-03T00:00:00Z');

    const result = analyticsService.getTimeBars(
      start,
      end,
      sessionParts,
      completedSessions,
      'day',
      'UTC'
    );

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

    const result = analyticsService.getTimeBars(
      start,
      end,
      sessionParts,
      completedSessions,
      'day',
      'UTC'
    );

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

    const result = analyticsService.getTimeBars(
      start,
      end,
      sessionParts,
      completedSessions,
      'day',
      'UTC'
    );

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

    const result = analyticsService.getTimeBars(
      start,
      end,
      sessionParts,
      completedSessions,
      'month',
      'UTC'
    );

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

    const result = analyticsService.getTimeBars(
      start,
      end,
      sessionParts,
      completedSessions,
      'month',
      'UTC'
    );

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

    const result = analyticsService.getTimeBars(
      start,
      end,
      sessionParts,
      completedSessions,
      'month',
      'UTC'
    );

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
  const mockActivities = [
    { name: 'Reading', activityGroup: { _id: '1', name: 'Study' } },
    { name: 'Coding', activityGroup: { _id: '2', name: 'Work' } },
  ];

  it('should return correct distribution when sessions and sessionParts match activities', async () => {
    (activityService.getActivities as jest.Mock).mockResolvedValue(
      mockActivities
    );

    const completedSessions = [
      { activity: { name: 'Reading' } },
      { activity: { name: 'Reading' } },
      { activity: { name: 'Coding' } },
    ];

    const sessionParts = [
      { session: { activity: { name: 'Reading' } }, spentTimeSeconds: 100 },
      { session: { activity: { name: 'Coding' } }, spentTimeSeconds: 200 },
    ];

    const result = await analyticsService.getActivityDistributions(
      4, // allSessionsAmount
      400, // allSpentTimeSeconds
      sessionParts,
      completedSessions,
      'user123'
    );

    expect(result).toEqual([
      {
        activityName: 'Reading',
        activityGroup: { _id: '1', name: 'Study' },
        sessionsAmount: 2,
        spentTimeSeconds: 100,
      },
      {
        activityName: 'Coding',
        activityGroup: { _id: '2', name: 'Work' },
        sessionsAmount: 1,
        spentTimeSeconds: 200,
      },
      {
        activityName: 'Without activity',
        activityGroup: { _id: '0', name: 'wo' },
        sessionsAmount: 1, // 4 - 3
        spentTimeSeconds: 100, // 400 - (100+200)
      },
    ]);
  });

  it('should not add "Without activity" if time and sessions match exactly', async () => {
    (activityService.getActivities as jest.Mock).mockResolvedValue(
      mockActivities
    );

    const completedSessions = [{ activity: { name: 'Reading' } }];

    const sessionParts = [
      { session: { activity: { name: 'Reading' } }, spentTimeSeconds: 300 },
    ];

    const result = await analyticsService.getActivityDistributions(
      1,
      300,
      sessionParts,
      completedSessions,
      'user123'
    );

    expect(result).toHaveLength(1); // only one activity - reading, even if there are many activities returned in getActivities

    expect(result).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ activityName: 'Without activity' }),
      ])
    );
  });
});
