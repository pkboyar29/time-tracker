import analyticsService from '../../service/analytics.service';

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
