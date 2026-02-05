import analyticsService from '../../../service/analytics.service';
import { IActivity } from '../../../model/activity.model';
import { Types } from 'mongoose';
import { ISessionPart } from '../../../model/sessionPart.model';
import { ISession } from '../../../model/session.model';
import {
  ActivityDistribution,
  AnalyticsForRangeDTO,
  SessionStatistics,
  TimeBar,
} from '../../../dto/analytics.dto';
import * as dateUtils from '../../../helpers/getTodayRange';

describe('analyticsService.getSessionStatistics', () => {
  it('should sum correctly', () => {
    const sessionParts: ISessionPart[] = [
      {
        _id: new Types.ObjectId(),
        spentTimeSeconds: 120,
        session: { activity: { id: new Types.ObjectId(), name: 'Reading' } },
        user: new Types.ObjectId(),
        paused: true,
        createdDate: new Date('2025-09-20T10:00:00Z'),
      },
      {
        _id: new Types.ObjectId(),
        spentTimeSeconds: 90,
        session: { activity: { id: new Types.ObjectId(), name: 'Coding' } },
        user: new Types.ObjectId(),
        paused: true,
        createdDate: new Date('2025-09-20T12:00:00Z'),
      },
      {
        _id: new Types.ObjectId(),
        spentTimeSeconds: 60,
        session: { activity: { id: new Types.ObjectId(), name: 'Exercise' } },
        user: new Types.ObjectId(),
        paused: false,
        createdDate: new Date('2025-09-20T14:00:00Z'),
      },
    ];

    const completedSessions: ISession[] = [
      {
        _id: new Types.ObjectId(),
        totalTimeSeconds: 300,
        spentTimeSeconds: 300,
        note: 'Morning session',
        completed: true,
        activity: { id: new Types.ObjectId(), name: 'Reading' },
        user: new Types.ObjectId(),
        createdDate: new Date('2025-09-20T08:00:00Z'),
        updatedDate: new Date('2025-09-20T08:30:00Z'),
        deleted: false,
      },
      {
        _id: new Types.ObjectId(),
        totalTimeSeconds: 180,
        spentTimeSeconds: 180,
        note: 'Afternoon session',
        completed: true,
        activity: { id: new Types.ObjectId(), name: 'Coding' },
        user: new Types.ObjectId(),
        createdDate: new Date('2025-09-20T14:00:00Z'),
        updatedDate: new Date('2025-09-20T14:30:00Z'),
        deleted: false,
      },
    ];

    const { spentTimeSeconds, sessionsAmount, pausedAmount } =
      analyticsService.getSessionsStatistics({
        sessionParts,
        completedSessions,
      });
    expect(spentTimeSeconds).toBe(270);
    expect(sessionsAmount).toBe(2);
    expect(pausedAmount).toBe(2);
  });
});

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
  const readingObjectId = new Types.ObjectId();
  const codingObjectId = new Types.ObjectId();
  const mockActivities: IActivity[] = [
    {
      _id: readingObjectId,
      name: 'Reading',
      color: '#fff000',
      user: new Types.ObjectId(),
      activityGroup: {
        _id: new Types.ObjectId(),
        name: 'activity group name',
      },
      createdDate: new Date(),
      updatedDate: new Date(),
      deleted: false,
      archived: false,
      sessionsAmount: 0,
      spentTimeSeconds: 0,
    },
    {
      _id: codingObjectId,
      name: 'Coding',
      color: '#000fff',
      user: new Types.ObjectId(),
      activityGroup: {
        _id: new Types.ObjectId(),
        name: 'activity group name',
      },
      createdDate: new Date(),
      updatedDate: new Date(),
      deleted: false,
      archived: false,
      sessionsAmount: 0,
      spentTimeSeconds: 0,
    },
  ];

  const sessionParts: ISessionPart[] = [
    {
      _id: new Types.ObjectId(),
      session: { activity: { id: readingObjectId, name: 'Reading' } },
      spentTimeSeconds: 1200,
      createdDate: new Date('2025-07-01T10:00:00Z'),
      paused: false,
      user: new Types.ObjectId(),
    },
    {
      _id: new Types.ObjectId(),
      session: { activity: { id: readingObjectId, name: 'Reading' } },
      spentTimeSeconds: 600,
      createdDate: new Date('2025-07-01T12:00:00Z'),
      paused: true,
      user: new Types.ObjectId(),
    },
    {
      _id: new Types.ObjectId(),
      session: { activity: { id: readingObjectId, name: 'Reading' } },
      spentTimeSeconds: 900,
      createdDate: new Date('2025-07-02T09:00:00Z'),
      paused: false,
      user: new Types.ObjectId(),
    },
  ];

  const completedSessions: ISession[] = [
    {
      _id: new Types.ObjectId(),
      activity: { id: readingObjectId, name: 'Reading' },
      totalTimeSeconds: 0,
      spentTimeSeconds: 0,
      completed: false,
      user: new Types.ObjectId(),
      createdDate: new Date(),
      updatedDate: new Date('2025-07-01T13:00:00Z'),
      deleted: false,
    },
    {
      _id: new Types.ObjectId(),
      activity: { id: readingObjectId, name: 'Reading' },
      totalTimeSeconds: 0,
      spentTimeSeconds: 0,
      completed: false,
      user: new Types.ObjectId(),
      createdDate: new Date(),
      updatedDate: new Date('2025-07-02T14:00:00Z'),
      deleted: false,
    },
    {
      _id: new Types.ObjectId(),
      activity: { id: codingObjectId, name: 'Coding' },
      totalTimeSeconds: 0,
      spentTimeSeconds: 0,
      completed: false,
      user: new Types.ObjectId(),
      createdDate: new Date(),
      updatedDate: new Date('2025-07-02T15:00:00Z'),
      deleted: false,
    },
  ];

  it('should return correct hour-based time bars', () => {
    const start = new Date('2025-12-29T00:00:00Z');
    const end = new Date('2025-12-29T12:00:00Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      sessionParts,
      completedSessions,
      barType: 'hour',
      timezone: 'UTC',
      userActivities: mockActivities,
    });

    expect(result).toHaveLength(12);
    expect(result[0].startOfRange).toEqual(new Date('2025-12-29T00:00:00Z'));
    expect(result[0].endOfRange).toEqual(new Date('2025-12-29T01:00:00Z'));

    expect(result[1].startOfRange).toEqual(new Date('2025-12-29T01:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-12-29T02:00:00Z'));

    expect(result[11].startOfRange).toEqual(new Date('2025-12-29T11:00:00Z'));
    expect(result[11].endOfRange).toEqual(new Date('2025-12-29T12:00:00Z'));
  });

  it('should return correct hour-based time bars when the range starts at a non-zero minute', () => {
    const start = new Date('2025-12-29T00:12:00Z');
    const end = new Date('2025-12-29T12:00:00Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      sessionParts,
      completedSessions,
      barType: 'hour',
      timezone: 'UTC',
      userActivities: mockActivities,
    });

    expect(result).toHaveLength(12);
    expect(result[0].startOfRange).toEqual(new Date('2025-12-29T00:12:00Z'));
    expect(result[0].endOfRange).toEqual(new Date('2025-12-29T01:00:00Z'));

    expect(result[1].startOfRange).toEqual(new Date('2025-12-29T01:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-12-29T02:00:00Z'));

    expect(result[11].startOfRange).toEqual(new Date('2025-12-29T11:00:00Z'));
    expect(result[11].endOfRange).toEqual(new Date('2025-12-29T12:00:00Z'));
  });

  it('should return correct hour-based time bars and cut last period to end of range', () => {
    const start = new Date('2025-12-29T00:12:00Z');
    const end = new Date('2025-12-29T12:25:00Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      sessionParts,
      completedSessions,
      barType: 'hour',
      timezone: 'UTC',
      userActivities: mockActivities,
    });

    expect(result).toHaveLength(13);
    expect(result[0].startOfRange).toEqual(new Date('2025-12-29T00:12:00Z'));
    expect(result[0].endOfRange).toEqual(new Date('2025-12-29T01:00:00Z'));

    expect(result[1].startOfRange).toEqual(new Date('2025-12-29T01:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-12-29T02:00:00Z'));

    expect(result[12].startOfRange).toEqual(new Date('2025-12-29T12:00:00Z'));
    expect(result[12].endOfRange).toEqual(new Date('2025-12-29T12:25:00Z'));
  });

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
      userActivities: mockActivities,
    });

    expect(result).toHaveLength(2);

    expect(result[0].startOfRange).toEqual(new Date('2025-07-01T00:00:00Z'));
    expect(result[0].endOfRange).toEqual(new Date('2025-07-02T00:00:00Z'));
    expect(result[0].sessionStatistics.spentTimeSeconds).toBe(1800);
    expect(result[0].sessionStatistics.sessionsAmount).toBe(1);
    expect(result[0].sessionStatistics.pausedAmount).toBe(1);

    expect(result[1].startOfRange).toEqual(new Date('2025-07-02T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-07-03T00:00:00Z'));
    expect(result[1].sessionStatistics.spentTimeSeconds).toBe(900);
    expect(result[1].sessionStatistics.sessionsAmount).toBe(2);
    expect(result[1].sessionStatistics.pausedAmount).toBe(0);
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
      userActivities: mockActivities,
    });

    expect(result).toHaveLength(2);

    expect(result[0].startOfRange).toEqual(new Date('2025-07-01T00:00:00Z'));
    expect(result[0].endOfRange).toEqual(new Date('2025-07-02T00:00:00Z'));
    expect(result[0].sessionStatistics.spentTimeSeconds).toBe(1800);
    expect(result[0].sessionStatistics.sessionsAmount).toBe(1);
    expect(result[0].sessionStatistics.pausedAmount).toBe(1);

    expect(result[1].startOfRange).toEqual(new Date('2025-07-02T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-07-02T18:00:00Z'));
    expect(result[1].sessionStatistics.spentTimeSeconds).toBe(900);
    expect(result[1].sessionStatistics.sessionsAmount).toBe(2);
    expect(result[1].sessionStatistics.pausedAmount).toBe(0);
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
      userActivities: mockActivities,
    });

    expect(result).toHaveLength(2);

    expect(result[0].startOfRange).toEqual(new Date('2025-07-01T12:00:00Z'));
    expect(result[0].endOfRange).toEqual(new Date('2025-07-02T00:00:00Z'));
    expect(result[0].sessionStatistics.spentTimeSeconds).toBe(600);
    expect(result[0].sessionStatistics.sessionsAmount).toBe(1);
    expect(result[0].sessionStatistics.pausedAmount).toBe(1);

    expect(result[1].startOfRange).toEqual(new Date('2025-07-02T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-07-03T00:00:00Z'));
    expect(result[1].sessionStatistics.spentTimeSeconds).toBe(900);
    expect(result[1].sessionStatistics.sessionsAmount).toBe(2);
    expect(result[1].sessionStatistics.pausedAmount).toBe(0);
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
      userActivities: mockActivities,
    });

    expect(result).toHaveLength(2);

    expect(result[0].startOfRange).toEqual(new Date('2025-07-01T00:00:00Z'));
    expect(result[0].endOfRange).toEqual(new Date('2025-08-01T00:00:00Z'));
    expect(result[0].sessionStatistics.spentTimeSeconds).toBe(2700);
    expect(result[0].sessionStatistics.sessionsAmount).toBe(3);
    expect(result[0].sessionStatistics.pausedAmount).toBe(1);

    expect(result[1].startOfRange).toEqual(new Date('2025-08-01T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-09-01T00:00:00Z'));
    expect(result[1].sessionStatistics.spentTimeSeconds).toBe(0);
    expect(result[1].sessionStatistics.sessionsAmount).toBe(0);
    expect(result[1].sessionStatistics.pausedAmount).toBe(0);
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
      userActivities: mockActivities,
    });

    expect(result).toHaveLength(2);

    expect(result[0].startOfRange).toEqual(new Date('2025-07-01T00:00:00Z'));
    expect(result[0].endOfRange).toEqual(new Date('2025-08-01T00:00:00Z'));
    expect(result[0].sessionStatistics.spentTimeSeconds).toBe(2700);
    expect(result[0].sessionStatistics.sessionsAmount).toBe(3);
    expect(result[0].sessionStatistics.pausedAmount).toBe(1);

    expect(result[1].startOfRange).toEqual(new Date('2025-08-01T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-08-10T00:00:00Z'));
    expect(result[1].sessionStatistics.spentTimeSeconds).toBe(0);
    expect(result[1].sessionStatistics.sessionsAmount).toBe(0);
    expect(result[1].sessionStatistics.pausedAmount).toBe(0);
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
      userActivities: mockActivities,
    });

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      startOfRange: new Date('2025-05-10T12:00:00Z'),
      endOfRange: new Date('2025-06-01T00:00:00Z'),
      sessionStatistics: {
        spentTimeSeconds: 0,
        sessionsAmount: 0,
        pausedAmount: 0,
      },
      activityDistribution: [],
    });

    expect(result[1]).toEqual({
      startOfRange: new Date('2025-06-01T00:00:00Z'),
      endOfRange: new Date('2025-07-01T00:00:00Z'),
      sessionStatistics: {
        spentTimeSeconds: 0,
        sessionsAmount: 0,
        pausedAmount: 0,
      },
      activityDistribution: [],
    });
  });

  it('should split month time bars correctly when working with other timezone', () => {
    const start = new Date('2024-06-30T21:00:00.000Z');
    const end = new Date('2024-12-31T21:00:00.000Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      sessionParts: [],
      completedSessions: [],
      barType: 'month',
      timezone: 'Europe/Moscow',
      userActivities: mockActivities,
    });

    expect(result.length).toBe(6);
    expect(result[0]).toEqual({
      startOfRange: new Date('2024-06-30T21:00:00.000Z'),
      endOfRange: new Date('2024-07-31T21:00:00.000Z'),
      sessionStatistics: {
        spentTimeSeconds: 0,
        sessionsAmount: 0,
        pausedAmount: 0,
      },
      activityDistribution: [],
    });
    expect(result[1]).toEqual({
      startOfRange: new Date('2024-07-31T21:00:00.000Z'),
      endOfRange: new Date('2024-08-31T21:00:00.000Z'),
      sessionStatistics: {
        spentTimeSeconds: 0,
        sessionsAmount: 0,
        pausedAmount: 0,
      },
      activityDistribution: [],
    });
    expect(result[2]).toEqual({
      startOfRange: new Date('2024-08-31T21:00:00.000Z'),
      endOfRange: new Date('2024-09-30T21:00:00.000Z'),
      sessionStatistics: {
        spentTimeSeconds: 0,
        sessionsAmount: 0,
        pausedAmount: 0,
      },
      activityDistribution: [],
    });
    expect(result[3]).toEqual({
      startOfRange: new Date('2024-09-30T21:00:00.000Z'),
      endOfRange: new Date('2024-10-31T21:00:00.000Z'),
      sessionStatistics: {
        spentTimeSeconds: 0,
        sessionsAmount: 0,
        pausedAmount: 0,
      },
      activityDistribution: [],
    });
    expect(result[4]).toEqual({
      startOfRange: new Date('2024-10-31T21:00:00.000Z'),
      endOfRange: new Date('2024-11-30T21:00:00.000Z'),
      sessionStatistics: {
        spentTimeSeconds: 0,
        sessionsAmount: 0,
        pausedAmount: 0,
      },
      activityDistribution: [],
    });
    expect(result[5]).toEqual({
      startOfRange: new Date('2024-11-30T21:00:00.000Z'),
      endOfRange: new Date('2024-12-31T21:00:00.000Z'),
      sessionStatistics: {
        spentTimeSeconds: 0,
        sessionsAmount: 0,
        pausedAmount: 0,
      },
      activityDistribution: [],
    });
  });

  it('should return correct activity distributions in time bars', () => {
    const start = new Date('2025-07-01T00:00:00.000Z');
    const end = new Date('2025-07-03T00:00:00.000Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      sessionParts,
      completedSessions,
      barType: 'day',
      timezone: 'UTC',
      userActivities: mockActivities,
    });

    expect(result[0].activityDistribution).toEqual([
      {
        id: readingObjectId.toString(),
        name: 'Reading',
        color: '#fff000',
        sessionStatistics: {
          spentTimeSeconds: 1800,
          sessionsAmount: 1,
          pausedAmount: 1,
        },
      },
    ]);
    expect(result[1].activityDistribution).toEqual([
      {
        id: readingObjectId.toString(),
        name: 'Reading',
        color: '#fff000',
        sessionStatistics: {
          spentTimeSeconds: 900,
          sessionsAmount: 1,
          pausedAmount: 0,
        },
      },
      {
        id: codingObjectId.toString(),
        name: 'Coding',
        color: '#000fff',
        sessionStatistics: {
          spentTimeSeconds: 0,
          sessionsAmount: 1,
          pausedAmount: 0,
        },
      },
    ]);
  });
});

describe('analyticsService.getActivityDistributions', () => {
  const readingObjectId = new Types.ObjectId();
  const codingObjectId = new Types.ObjectId();
  const readingMeta = {
    _id: readingObjectId,
    name: 'Reading',
    color: '#fff000',
  };
  const codingMeta = {
    _id: codingObjectId,
    name: 'Coding',
    color: '#000fff',
  };
  const readingAdMeta = {
    id: readingObjectId.toString(),
    name: 'Reading',
    color: '#fff000',
  };
  const codingAdMeta = {
    id: codingObjectId.toString(),
    name: 'Coding',
    color: '#000fff',
  };

  const mockActivities: IActivity[] = [
    {
      ...readingMeta,
      user: new Types.ObjectId(),
      activityGroup: {
        _id: new Types.ObjectId(),
        name: 'activity group name',
      },
      createdDate: new Date(),
      updatedDate: new Date(),
      deleted: false,
      archived: false,
      sessionsAmount: 0,
      spentTimeSeconds: 0,
    },
    {
      ...codingMeta,
      user: new Types.ObjectId(),
      activityGroup: {
        _id: new Types.ObjectId(),
        name: 'activity group name',
      },
      createdDate: new Date(),
      updatedDate: new Date(),
      deleted: false,
      archived: false,
      sessionsAmount: 0,
      spentTimeSeconds: 0,
    },
  ];

  it('should return correct distribution when sessions and sessionParts match activities', async () => {
    const completedSessions: ISession[] = [
      {
        _id: new Types.ObjectId(),
        activity: { id: readingMeta._id, name: readingMeta.name },
        totalTimeSeconds: 0,
        spentTimeSeconds: 0,
        completed: false,
        user: new Types.ObjectId(),
        createdDate: new Date(),
        updatedDate: new Date(),
        deleted: false,
      },
      {
        _id: new Types.ObjectId(),
        activity: { id: readingMeta._id, name: readingMeta.name },
        totalTimeSeconds: 0,
        spentTimeSeconds: 0,
        completed: false,
        user: new Types.ObjectId(),
        createdDate: new Date(),
        updatedDate: new Date(),
        deleted: false,
      },
      {
        _id: new Types.ObjectId(),
        activity: { id: codingMeta._id, name: codingMeta.name },
        totalTimeSeconds: 0,
        spentTimeSeconds: 0,
        completed: false,
        user: new Types.ObjectId(),
        createdDate: new Date(),
        updatedDate: new Date(),
        deleted: false,
      },
    ];

    const sessionParts: ISessionPart[] = [
      {
        _id: new Types.ObjectId(),
        session: { activity: { id: readingMeta._id, name: readingMeta.name } },
        spentTimeSeconds: 100,
        createdDate: new Date(),
        paused: true,
        user: new Types.ObjectId(),
      },
      {
        _id: new Types.ObjectId(),
        session: { activity: { id: codingMeta._id, name: codingMeta.name } },
        spentTimeSeconds: 200,
        createdDate: new Date(),
        paused: false,
        user: new Types.ObjectId(),
      },
      {
        _id: new Types.ObjectId(),
        session: { activity: { id: codingMeta._id, name: codingMeta.name } },
        spentTimeSeconds: 200,
        createdDate: new Date(),
        paused: true,
        user: new Types.ObjectId(),
      },
    ];

    const result = analyticsService.getActivityDistributions({
      allSessionsAmount: 4,
      allSpentTimeSeconds: 600,
      allPausedAmount: 2,
      sessionParts,
      completedSessions,
      userActivities: mockActivities,
    });

    expect(result).toEqual([
      {
        ...readingAdMeta,
        name: 'Reading',
        color: '#fff000',
        sessionStatistics: {
          spentTimeSeconds: 100,
          sessionsAmount: 2,
          pausedAmount: 1,
        },
      },
      {
        ...codingAdMeta,
        sessionStatistics: {
          spentTimeSeconds: 400,
          sessionsAmount: 1,
          pausedAmount: 1,
        },
      },
      {
        id: '0',
        name: 'Without activity',
        color: '#9CA3AF',
        sessionStatistics: {
          spentTimeSeconds: 100, // 400 - (100 + 200)
          sessionsAmount: 1, // 4 - 3
          pausedAmount: 0,
        },
      },
    ]);
  });

  it('should not add "Without activity" if time and sessions match exactly', async () => {
    const completedSessions: ISession[] = [
      {
        _id: new Types.ObjectId(),
        activity: { id: readingMeta._id, name: readingMeta.name },
        totalTimeSeconds: 0,
        spentTimeSeconds: 0,
        completed: false,
        user: new Types.ObjectId(),
        createdDate: new Date(),
        updatedDate: new Date(),
        deleted: false,
      },
    ];

    const sessionParts: ISessionPart[] = [
      {
        _id: new Types.ObjectId(),
        paused: false,
        session: { activity: { id: readingMeta._id, name: readingMeta.name } },
        spentTimeSeconds: 300,
        createdDate: new Date(),
        user: new Types.ObjectId(),
      },
    ];

    const result = analyticsService.getActivityDistributions({
      allSessionsAmount: 1,
      allSpentTimeSeconds: 300,
      allPausedAmount: 0,
      sessionParts,
      completedSessions,
      userActivities: mockActivities,
    });

    expect(result).toHaveLength(1); // only one activity - reading, even if there are many activities returned in getActivities

    expect(result).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: '0', name: 'Without activity' }),
      ]),
    );
  });
});

describe('analyticsService.mergeSessionStatistics', () => {
  it('correctly sums statistics from multiple entries', () => {
    const input: SessionStatistics[] = [
      {
        sessionsAmount: 2,
        spentTimeSeconds: 120,
        pausedAmount: 1,
      },
      {
        sessionsAmount: 3,
        spentTimeSeconds: 300,
        pausedAmount: 2,
      },
    ];

    const result = analyticsService.mergeSessionStatistics(input);

    expect(result).toEqual({
      sessionsAmount: 5,
      spentTimeSeconds: 420,
      pausedAmount: 3,
    });
  });

  it('returns zeros when an empty array is provided', () => {
    const result = analyticsService.mergeSessionStatistics([]);

    expect(result).toEqual({
      sessionsAmount: 0,
      spentTimeSeconds: 0,
      pausedAmount: 0,
    });
  });

  it('correctly handles a single entry', () => {
    const input: SessionStatistics[] = [
      {
        sessionsAmount: 1,
        spentTimeSeconds: 60,
        pausedAmount: 0,
      },
    ];

    const result = analyticsService.mergeSessionStatistics(input);

    expect(result).toEqual({
      sessionsAmount: 1,
      spentTimeSeconds: 60,
      pausedAmount: 0,
    });
  });

  it('correctly sums zero values', () => {
    const input: SessionStatistics[] = [
      {
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        pausedAmount: 0,
      },
      {
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        pausedAmount: 0,
      },
    ];

    const result = analyticsService.mergeSessionStatistics(input);

    expect(result).toEqual({
      sessionsAmount: 0,
      spentTimeSeconds: 0,
      pausedAmount: 0,
    });
  });
});

describe('analyticsService.mergeActivityDistributions', () => {
  const aMeta = {
    id: new Types.ObjectId().toString(),
    name: 'A',
    color: '#aaa000',
  };
  const bMeta = {
    id: new Types.ObjectId().toString(),
    name: 'B',
    color: '#bbb000',
  };
  const cMeta = {
    id: new Types.ObjectId().toString(),

    name: 'C',
    color: '#ccc000',
  };
  const dMeta = {
    id: new Types.ObjectId().toString(),
    name: 'D',
    color: '#ddd000',
  };
  const eMeta = {
    id: new Types.ObjectId().toString(),
    name: 'E',
    color: '#eee000',
  };

  const firstAd: ActivityDistribution[] = [
    {
      ...aMeta,
      sessionStatistics: {
        sessionsAmount: 1,
        spentTimeSeconds: 100,
        pausedAmount: 1,
      },
    },
    {
      ...bMeta,
      sessionStatistics: {
        sessionsAmount: 1,
        spentTimeSeconds: 200,
        pausedAmount: 0,
      },
    },
  ];
  const secondAd: ActivityDistribution[] = [
    {
      ...aMeta,
      sessionStatistics: {
        sessionsAmount: 1,
        spentTimeSeconds: 50,
        pausedAmount: 1,
      },
    },
    {
      ...cMeta,
      sessionStatistics: {
        sessionsAmount: 1,
        spentTimeSeconds: 100,
        pausedAmount: 2,
      },
    },
  ];
  const thirdAd: ActivityDistribution[] = [
    {
      ...aMeta,
      sessionStatistics: {
        sessionsAmount: 1,
        spentTimeSeconds: 50,
        pausedAmount: 0,
      },
    },
    {
      ...bMeta,
      sessionStatistics: {
        sessionsAmount: 2,
        spentTimeSeconds: 200,
        pausedAmount: 0,
      },
    },
    {
      ...dMeta,
      sessionStatistics: {
        sessionsAmount: 1,
        spentTimeSeconds: 100,
        pausedAmount: 0,
      },
    },
  ];
  const fourthAd: ActivityDistribution[] = [
    {
      ...bMeta,
      sessionStatistics: {
        sessionsAmount: 2,
        spentTimeSeconds: 100,
        pausedAmount: 0,
      },
    },
    {
      ...dMeta,
      sessionStatistics: {
        sessionsAmount: 0,
        spentTimeSeconds: 300,
        pausedAmount: 1,
      },
    },
    {
      ...eMeta,
      sessionStatistics: {
        sessionsAmount: 2,
        spentTimeSeconds: 200,
        pausedAmount: 0,
      },
    },
  ];

  it('should correctly handle an empty array input', () => {
    const result = analyticsService.mergeActivityDistributions({
      adsList: [],
    });
    expect(result).toEqual([]);
  });

  it('should correctly handle array with one ad', () => {
    const result = analyticsService.mergeActivityDistributions({
      adsList: [firstAd],
    });
    expect(result).toEqual(firstAd);
  });

  it('should merge two activityDistributions correctly', () => {
    const result = analyticsService.mergeActivityDistributions({
      adsList: [firstAd, secondAd],
    });

    expect(result).toHaveLength(3);

    const activityA = result.find((a) => a.id === aMeta.id);
    expect(activityA).toEqual({
      ...aMeta,
      sessionStatistics: {
        sessionsAmount: 2,
        spentTimeSeconds: 150,
        pausedAmount: 2,
      },
    });

    const activityB = result.find((a) => a.id === bMeta.id);
    expect(activityB).toEqual({
      ...bMeta,
      sessionStatistics: {
        sessionsAmount: 1,
        spentTimeSeconds: 200,
        pausedAmount: 0,
      },
    });

    const activityC = result.find((a) => a.id === cMeta.id);
    expect(activityC).toEqual({
      ...cMeta,
      sessionStatistics: {
        sessionsAmount: 1,
        spentTimeSeconds: 100,
        pausedAmount: 2,
      },
    });
  });

  it('should merge four activityDistributions correctly', () => {
    const result = analyticsService.mergeActivityDistributions({
      adsList: [firstAd, secondAd, thirdAd, fourthAd],
    });

    expect(result).toHaveLength(5);
    const activityA = result.find((a) => a.id === aMeta.id);
    expect(activityA).toEqual({
      ...aMeta,
      sessionStatistics: {
        sessionsAmount: 3,
        spentTimeSeconds: 200,
        pausedAmount: 2,
      },
    });

    const activityB = result.find((a) => a.id === bMeta.id);
    expect(activityB).toEqual({
      ...bMeta,
      sessionStatistics: {
        sessionsAmount: 5,
        spentTimeSeconds: 500,
        pausedAmount: 0,
      },
    });

    const activityC = result.find((a) => a.id === cMeta.id);
    expect(activityC).toEqual({
      ...cMeta,
      sessionStatistics: {
        sessionsAmount: 1,
        spentTimeSeconds: 100,
        pausedAmount: 2,
      },
    });

    const activityD = result.find((a) => a.id === dMeta.id);
    expect(activityD).toEqual({
      ...dMeta,
      sessionStatistics: {
        sessionsAmount: 1,
        spentTimeSeconds: 400,
        pausedAmount: 1,
      },
    });

    const activityE = result.find((a) => a.id === eMeta.id);
    expect(activityE).toEqual({
      ...eMeta,
      sessionStatistics: {
        sessionsAmount: 2,
        spentTimeSeconds: 200,
        pausedAmount: 0,
      },
    });
  });
});

describe('analyticsService.mergeAnalytics', () => {
  const timezone = 'UTC';
  const startOfToday = new Date('2025-09-20T00:00:00Z');
  const startOfTomorrow = new Date('2025-09-21T00:00:00Z');

  const dayTimeBars: TimeBar[] = Array.from({ length: 24 }, (_, h) => ({
    startOfRange: new Date(`2025-09-19T${String(h).padStart(2, '0')}:00:00Z`),
    endOfRange: new Date(`2025-09-19T${String(h + 1).padStart(2, '0')}:00:00Z`),
    sessionStatistics: {
      sessionsAmount: 0,
      spentTimeSeconds: 0,
      pausedAmount: 0,
    },
    activityDistribution: [],
  }));

  const aMeta = {
    id: new Types.ObjectId().toString(),
    name: 'A',
    color: '#aaa000',
  };
  const bMeta = {
    id: new Types.ObjectId().toString(),
    name: 'B',
    color: '#bbb000',
  };
  const cMeta = {
    id: new Types.ObjectId().toString(),
    name: 'C',
    color: '#ccc000',
  };

  const untilTodayObj: AnalyticsForRangeDTO = {
    sessionStatistics: {
      sessionsAmount: 2,
      spentTimeSeconds: 300,
      pausedAmount: 2,
    },
    activityDistribution: [
      {
        ...aMeta,
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 100,
          pausedAmount: 1,
        },
      },
      {
        ...bMeta,
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 200,
          pausedAmount: 1,
        },
      },
    ],
    timeBars: [
      {
        startOfRange: new Date('2025-09-18T00:00:00Z'),
        endOfRange: new Date('2025-09-19T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 25,
          pausedAmount: 2,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-09-19T00:00:00Z'),
        endOfRange: new Date('2025-09-20T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 25,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
    ],
  };

  const todayObj: AnalyticsForRangeDTO = {
    sessionStatistics: {
      sessionsAmount: 1,
      spentTimeSeconds: 150,
      pausedAmount: 1,
    },
    activityDistribution: [
      {
        ...aMeta,
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 50,
          pausedAmount: 1,
        },
      },
      {
        ...cMeta,
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 100,
          pausedAmount: 0,
        },
      },
    ],
    timeBars: [
      // 00:00 – 01:00
      {
        startOfRange: new Date('2025-09-20T00:00:00Z'),
        endOfRange: new Date('2025-09-20T01:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      // 01:00 – 02:00
      {
        startOfRange: new Date('2025-09-20T01:00:00Z'),
        endOfRange: new Date('2025-09-20T02:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      // 02:00 – 03:00
      {
        startOfRange: new Date('2025-09-20T02:00:00Z'),
        endOfRange: new Date('2025-09-20T03:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      // 03:00 – 04:00
      {
        startOfRange: new Date('2025-09-20T03:00:00Z'),
        endOfRange: new Date('2025-09-20T04:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      // 04:00 – 05:00
      {
        startOfRange: new Date('2025-09-20T04:00:00Z'),
        endOfRange: new Date('2025-09-20T05:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      // 05:00 – 06:00
      {
        startOfRange: new Date('2025-09-20T05:00:00Z'),
        endOfRange: new Date('2025-09-20T06:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      // 06:00 – 07:00
      {
        startOfRange: new Date('2025-09-20T06:00:00Z'),
        endOfRange: new Date('2025-09-20T07:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      // 07:00 – 08:00
      {
        startOfRange: new Date('2025-09-20T07:00:00Z'),
        endOfRange: new Date('2025-09-20T08:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      // 08:00 – 09:00
      {
        startOfRange: new Date('2025-09-20T08:00:00Z'),
        endOfRange: new Date('2025-09-20T09:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      // 09:00 – 10:00 (Activity A)
      {
        startOfRange: new Date('2025-09-20T09:00:00Z'),
        endOfRange: new Date('2025-09-20T10:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 50,
          pausedAmount: 1,
        },
        activityDistribution: [
          {
            ...aMeta,
            sessionStatistics: {
              sessionsAmount: 1,
              spentTimeSeconds: 50,
              pausedAmount: 1,
            },
          },
        ],
      },
      // 10:00 – 11:00
      {
        startOfRange: new Date('2025-09-20T10:00:00Z'),
        endOfRange: new Date('2025-09-20T11:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      // 11:00 – 12:00
      {
        startOfRange: new Date('2025-09-20T11:00:00Z'),
        endOfRange: new Date('2025-09-20T12:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      // 12:00 – 13:00
      {
        startOfRange: new Date('2025-09-20T12:00:00Z'),
        endOfRange: new Date('2025-09-20T13:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      // 13:00 – 14:00
      {
        startOfRange: new Date('2025-09-20T13:00:00Z'),
        endOfRange: new Date('2025-09-20T14:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      // 14:00 – 15:00 (Activity C)
      {
        startOfRange: new Date('2025-09-20T14:00:00Z'),
        endOfRange: new Date('2025-09-20T15:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 100,
          pausedAmount: 0,
        },
        activityDistribution: [
          {
            ...cMeta,
            sessionStatistics: {
              sessionsAmount: 0,
              spentTimeSeconds: 100,
              pausedAmount: 0,
            },
          },
        ],
      },
      // 15:00 – 16:00
      // {
      //   startOfRange: new Date('2025-09-20T15:00:00Z'),
      //   endOfRange: new Date('2025-09-20T16:00:00Z'),
      //   sessionStatistics: {
      //     sessionsAmount: 0,
      //     spentTimeSeconds: 0,
      //     pausedAmount: 0,
      //   },
      //   activityDistribution: [],
      // },
      // 16:00 – 17:00
      // {
      //   startOfRange: new Date('2025-09-20T16:00:00Z'),
      //   endOfRange: new Date('2025-09-20T17:00:00Z'),
      //   sessionStatistics: {
      //     sessionsAmount: 0,
      //     spentTimeSeconds: 0,
      //     pausedAmount: 0,
      //   },
      //   activityDistribution: [],
      // },
      // 17:00 – 18:00
      // {
      //   startOfRange: new Date('2025-09-20T17:00:00Z'),
      //   endOfRange: new Date('2025-09-20T18:00:00Z'),
      //   sessionStatistics: {
      //     sessionsAmount: 0,
      //     spentTimeSeconds: 0,
      //     pausedAmount: 0,
      //   },
      //   activityDistribution: [],
      // },
      // 18:00 – 19:00
      // {
      //   startOfRange: new Date('2025-09-20T18:00:00Z'),
      //   endOfRange: new Date('2025-09-20T19:00:00Z'),
      //   sessionStatistics: {
      //     sessionsAmount: 0,
      //     spentTimeSeconds: 0,
      //     pausedAmount: 0,
      //   },
      //   activityDistribution: [],
      // },
      // 19:00 – 20:00
      // {
      //   startOfRange: new Date('2025-09-20T19:00:00Z'),
      //   endOfRange: new Date('2025-09-20T20:00:00Z'),
      //   sessionStatistics: {
      //     sessionsAmount: 0,
      //     spentTimeSeconds: 0,
      //     pausedAmount: 0,
      //   },
      //   activityDistribution: [],
      // },
      // 20:00 – 21:00
      // {
      //   startOfRange: new Date('2025-09-20T20:00:00Z'),
      //   endOfRange: new Date('2025-09-20T21:00:00Z'),
      //   sessionStatistics: {
      //     sessionsAmount: 0,
      //     spentTimeSeconds: 0,
      //     pausedAmount: 0,
      //   },
      //   activityDistribution: [],
      // },
      // 21:00 – 22:00
      // {
      //   startOfRange: new Date('2025-09-20T21:00:00Z'),
      //   endOfRange: new Date('2025-09-20T22:00:00Z'),
      //   sessionStatistics: {
      //     sessionsAmount: 0,
      //     spentTimeSeconds: 0,
      //     pausedAmount: 0,
      //   },
      //   activityDistribution: [],
      // },
      // 22:00 – 23:00
      // {
      //   startOfRange: new Date('2025-09-20T22:00:00Z'),
      //   endOfRange: new Date('2025-09-20T23:00:00Z'),
      //   sessionStatistics: {
      //     sessionsAmount: 0,
      //     spentTimeSeconds: 0,
      //     pausedAmount: 0,
      //   },
      //   activityDistribution: [],
      // },
      // 23:00 – 00:00
      // {
      //   startOfRange: new Date('2025-09-20T23:00:00Z'),
      //   endOfRange: new Date('2025-09-21T00:00:00Z'),
      //   sessionStatistics: {
      //     sessionsAmount: 0,
      //     spentTimeSeconds: 0,
      //     pausedAmount: 0,
      //   },
      //   activityDistribution: [],
      // },
    ],
  };

  it('should create correct hour timeBars', () => {
    jest.spyOn(dateUtils, 'getTodayRange').mockReturnValue({
      startOfToday,
      startOfTomorrow,
    });

    const untilTodayObj: AnalyticsForRangeDTO = {
      sessionStatistics: {
        spentTimeSeconds: 300,
        sessionsAmount: 3,
        pausedAmount: 0,
      },
      activityDistribution: [
        {
          ...aMeta,
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 100,
            pausedAmount: 0,
          },
        },
        {
          ...cMeta,
          sessionStatistics: {
            sessionsAmount: 2,
            spentTimeSeconds: 200,
            pausedAmount: 0,
          },
        },
      ],
      timeBars: [
        {
          startOfRange: new Date('2025-09-19T22:00:00Z'),
          endOfRange: new Date('2025-09-19T23:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 100,
            pausedAmount: 0,
          },
          activityDistribution: [
            {
              ...aMeta,
              sessionStatistics: {
                sessionsAmount: 1,
                spentTimeSeconds: 100,
                pausedAmount: 0,
              },
            },
          ],
        },
        {
          startOfRange: new Date('2025-09-19T23:00:00Z'),
          endOfRange: new Date('2025-09-20T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 2,
            spentTimeSeconds: 200,
            pausedAmount: 0,
          },
          activityDistribution: [
            {
              ...cMeta,
              sessionStatistics: {
                sessionsAmount: 2,
                spentTimeSeconds: 200,
                pausedAmount: 0,
              },
            },
          ],
        },
      ],
    };

    const result = analyticsService.mergeAnalytics({
      finalObjStartOfRange: new Date('2025-09-19T22:00:00Z'),
      finalObjEndOfRange: new Date('2025-09-20T15:00:00Z'),
      untilTodayObj,
      todayObj,
      timezone,
    });

    const timeBars = result.timeBars;
    expect(timeBars.length).toBe(17);
    expect(timeBars[0]).toEqual({
      startOfRange: new Date('2025-09-19T22:00:00Z'),
      endOfRange: new Date('2025-09-19T23:00:00Z'),
      sessionStatistics: {
        sessionsAmount: 1,
        spentTimeSeconds: 100,
        pausedAmount: 0,
      },
      activityDistribution: [
        {
          ...aMeta,
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 100,
            pausedAmount: 0,
          },
        },
      ],
    });
    expect(timeBars[1]).toEqual({
      startOfRange: new Date('2025-09-19T23:00:00Z'),
      endOfRange: new Date('2025-09-20T00:00:00Z'),
      sessionStatistics: {
        sessionsAmount: 2,
        spentTimeSeconds: 200,
        pausedAmount: 0,
      },
      activityDistribution: [
        {
          ...cMeta,
          sessionStatistics: {
            sessionsAmount: 2,
            spentTimeSeconds: 200,
            pausedAmount: 0,
          },
        },
      ],
    });
    expect(timeBars[2]).toEqual({
      startOfRange: new Date('2025-09-20T00:00:00Z'),
      endOfRange: new Date('2025-09-20T01:00:00Z'),
      sessionStatistics: {
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        pausedAmount: 0,
      },
      activityDistribution: [],
    });
  });

  it('should create correct dayy timeBars', () => {
    jest.spyOn(dateUtils, 'getTodayRange').mockReturnValue({
      startOfToday,
      startOfTomorrow,
    });

    const result = analyticsService.mergeAnalytics({
      finalObjStartOfRange: new Date('2025-09-18T00:00:00Z'),
      finalObjEndOfRange: new Date('2025-09-24T00:00:00Z'),
      untilTodayObj,
      todayObj,
      timezone,
    });

    const timeBars = result.timeBars;

    expect(timeBars.length).toBe(6);
    expect(timeBars[0]).toEqual({
      startOfRange: new Date('2025-09-18T00:00:00Z'),
      endOfRange: new Date('2025-09-19T00:00:00Z'),
      sessionStatistics: {
        sessionsAmount: 1,
        spentTimeSeconds: 25,
        pausedAmount: 2,
      },
      activityDistribution: [],
    });
    expect(timeBars[1]).toEqual({
      startOfRange: new Date('2025-09-19T00:00:00Z'),
      endOfRange: new Date('2025-09-20T00:00:00Z'),
      sessionStatistics: {
        sessionsAmount: 0,
        spentTimeSeconds: 25,
        pausedAmount: 0,
      },
      activityDistribution: [],
    });
    expect(timeBars[2]).toEqual({
      startOfRange: startOfToday,
      endOfRange: startOfTomorrow,
      sessionStatistics: {
        sessionsAmount: 1,
        spentTimeSeconds: 150,
        pausedAmount: 1,
      },
      activityDistribution: [
        {
          ...aMeta,
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 50,
            pausedAmount: 1,
          },
        },
        {
          ...cMeta,
          sessionStatistics: {
            sessionsAmount: 0,
            spentTimeSeconds: 100,
            pausedAmount: 0,
          },
        },
      ],
    });
    expect(timeBars[3]).toEqual({
      startOfRange: new Date('2025-09-21T00:00:00Z'),
      endOfRange: new Date('2025-09-22T00:00:00Z'),
      sessionStatistics: {
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        pausedAmount: 0,
      },
      activityDistribution: [],
    });
    expect(timeBars[4]).toEqual({
      startOfRange: new Date('2025-09-22T00:00:00Z'),
      endOfRange: new Date('2025-09-23T00:00:00Z'),
      sessionStatistics: {
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        pausedAmount: 0,
      },
      activityDistribution: [],
    });
    expect(timeBars[5]).toEqual({
      startOfRange: new Date('2025-09-23T00:00:00Z'),
      endOfRange: new Date('2025-09-24T00:00:00Z'),
      sessionStatistics: {
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        pausedAmount: 0,
      },
      activityDistribution: [],
    });
  });

  it('should create correct monthh timeBars', () => {
    jest.spyOn(dateUtils, 'getTodayRange').mockReturnValue({
      startOfToday,
      startOfTomorrow,
    });

    const untilTodayObj: AnalyticsForRangeDTO = {
      sessionStatistics: {
        sessionsAmount: 2,
        spentTimeSeconds: 300,
        pausedAmount: 3,
      },
      activityDistribution: [
        {
          ...aMeta,
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 100,
            pausedAmount: 2,
          },
        },
        {
          ...bMeta,
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 200,
            pausedAmount: 1,
          },
        },
      ],
      timeBars: [
        {
          startOfRange: new Date('2025-01-01T00:00:00Z'),
          endOfRange: new Date('2025-02-01T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 10,
            spentTimeSeconds: 25,
            pausedAmount: 2,
          },
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-02-01T00:00:00Z'),
          endOfRange: new Date('2025-03-01T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 0,
            spentTimeSeconds: 25,
            pausedAmount: 0,
          },
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-03-01T00:00:00Z'),
          endOfRange: new Date('2025-04-01T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 0,
            spentTimeSeconds: 25,
            pausedAmount: 0,
          },
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-04-01T00:00:00Z'),
          endOfRange: new Date('2025-05-01T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 0,
            spentTimeSeconds: 25,
            pausedAmount: 0,
          },
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-05-01T00:00:00Z'),
          endOfRange: new Date('2025-06-01T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 0,
            spentTimeSeconds: 25,
            pausedAmount: 0,
          },
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-06-01T00:00:00Z'),
          endOfRange: new Date('2025-07-01T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 0,
            spentTimeSeconds: 25,
            pausedAmount: 0,
          },
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-07-01T00:00:00Z'),
          endOfRange: new Date('2025-08-01T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 0,
            spentTimeSeconds: 25,
            pausedAmount: 0,
          },
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-08-01T00:00:00Z'),
          endOfRange: new Date('2025-09-01T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 0,
            spentTimeSeconds: 25,
            pausedAmount: 0,
          },
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-09-01T00:00:00Z'),
          endOfRange: new Date('2025-09-20T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 0,
            spentTimeSeconds: 25,
            pausedAmount: 4,
          },
          activityDistribution: [],
        },
      ],
    };

    const result = analyticsService.mergeAnalytics({
      finalObjStartOfRange: new Date('2025-01-01T00:00:00Z'),
      finalObjEndOfRange: new Date('2026-01-01T00:00:00Z'),
      untilTodayObj,
      todayObj,
      timezone,
    });

    const timeBars = result.timeBars;

    expect(timeBars.length).toBe(12);
    expect(timeBars).toEqual([
      {
        startOfRange: new Date('2025-01-01T00:00:00Z'),
        endOfRange: new Date('2025-02-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 10,
          spentTimeSeconds: 25,
          pausedAmount: 2,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-02-01T00:00:00Z'),
        endOfRange: new Date('2025-03-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 25,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-03-01T00:00:00Z'),
        endOfRange: new Date('2025-04-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 25,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-04-01T00:00:00Z'),
        endOfRange: new Date('2025-05-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 25,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-05-01T00:00:00Z'),
        endOfRange: new Date('2025-06-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 25,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-06-01T00:00:00Z'),
        endOfRange: new Date('2025-07-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 25,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-07-01T00:00:00Z'),
        endOfRange: new Date('2025-08-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 25,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-08-01T00:00:00Z'),
        endOfRange: new Date('2025-09-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 25,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-09-01T00:00:00Z'),
        endOfRange: new Date('2025-10-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 175,
          pausedAmount: 5,
        },
        activityDistribution: [
          {
            ...aMeta,
            sessionStatistics: {
              sessionsAmount: 1,
              spentTimeSeconds: 50,
              pausedAmount: 1,
            },
          },
          {
            ...cMeta,
            sessionStatistics: {
              sessionsAmount: 0,
              spentTimeSeconds: 100,
              pausedAmount: 0,
            },
          },
        ],
      },
      {
        startOfRange: new Date('2025-10-01T00:00:00Z'),
        endOfRange: new Date('2025-11-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-11-01T00:00:00Z'),
        endOfRange: new Date('2025-12-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-12-01T00:00:00Z'),
        endOfRange: new Date('2026-01-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
    ]);
  });

  it('should create correct day timeBars when starting from today 00:00', () => {
    jest.spyOn(dateUtils, 'getTodayRange').mockReturnValue({
      startOfToday,
      startOfTomorrow,
    });

    const untilTodayObj: AnalyticsForRangeDTO = {
      sessionStatistics: {
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        pausedAmount: 0,
      },
      activityDistribution: [],
      timeBars: [],
    };

    const result = analyticsService.mergeAnalytics({
      finalObjStartOfRange: new Date('2025-09-20T00:00:00Z'),
      finalObjEndOfRange: new Date('2025-09-23T00:00:00Z'),
      untilTodayObj,
      todayObj,
      timezone,
    });

    const timeBars = result.timeBars;
    expect(timeBars.length).toBe(3);
    expect(timeBars).toEqual([
      {
        startOfRange: new Date('2025-09-20T00:00:00Z'),
        endOfRange: new Date('2025-09-21T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 150,
          pausedAmount: 1,
        },
        activityDistribution: [
          {
            ...aMeta,
            sessionStatistics: {
              sessionsAmount: 1,
              spentTimeSeconds: 50,
              pausedAmount: 1,
            },
          },
          {
            ...cMeta,
            sessionStatistics: {
              sessionsAmount: 0,
              spentTimeSeconds: 100,
              pausedAmount: 0,
            },
          },
        ],
      },
      {
        startOfRange: new Date('2025-09-21T00:00:00Z'),
        endOfRange: new Date('2025-09-22T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-09-22T00:00:00Z'),
        endOfRange: new Date('2025-09-23T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
    ]);
  });

  it('should create correct day timebars when starting from yesterday (1 day until today)', () => {
    jest.spyOn(dateUtils, 'getTodayRange').mockReturnValue({
      startOfToday,
      startOfTomorrow,
    });

    const untilTodayObj: AnalyticsForRangeDTO = {
      sessionStatistics: {
        sessionsAmount: 1,
        spentTimeSeconds: 200,
        pausedAmount: 2,
      },
      activityDistribution: [],
      timeBars: [],
    };

    const result = analyticsService.mergeAnalytics({
      finalObjStartOfRange: new Date('2025-09-19T00:00:00Z'),
      finalObjEndOfRange: new Date('2025-09-23T00:00:00Z'),
      untilTodayObj,
      todayObj,
      timezone,
    });

    const timeBars = result.timeBars;
    expect(timeBars.length).toBe(4);
    expect(timeBars).toEqual([
      {
        startOfRange: new Date('2025-09-19T00:00:00Z'),
        endOfRange: new Date('2025-09-20T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 200,
          pausedAmount: 2,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-09-20T00:00:00Z'),
        endOfRange: new Date('2025-09-21T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 150,
          pausedAmount: 1,
        },
        activityDistribution: [
          {
            ...aMeta,
            sessionStatistics: {
              sessionsAmount: 1,
              spentTimeSeconds: 50,
              pausedAmount: 1,
            },
          },
          {
            ...cMeta,
            sessionStatistics: {
              sessionsAmount: 0,
              spentTimeSeconds: 100,
              pausedAmount: 0,
            },
          },
        ],
      },
      {
        startOfRange: new Date('2025-09-21T00:00:00Z'),
        endOfRange: new Date('2025-09-22T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-09-22T00:00:00Z'),
        endOfRange: new Date('2025-09-23T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
    ]);
  });

  it('should create correct day timebars when starting 2 hours until today', () => {
    jest.spyOn(dateUtils, 'getTodayRange').mockReturnValue({
      startOfToday,
      startOfTomorrow,
    });

    const untilTodayObj: AnalyticsForRangeDTO = {
      sessionStatistics: {
        sessionsAmount: 1,
        spentTimeSeconds: 200,
        pausedAmount: 2,
      },
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2025-09-19T22:00:00Z'),
          endOfRange: new Date('2025-09-19T23:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 0,
            spentTimeSeconds: 0,
            pausedAmount: 0,
          },
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-09-19T23:00:00Z'),
          endOfRange: new Date('2025-09-20T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 200,
            pausedAmount: 2,
          },
          activityDistribution: [],
        },
      ],
    };

    const result = analyticsService.mergeAnalytics({
      finalObjStartOfRange: new Date('2025-09-19T22:00:00Z'),
      finalObjEndOfRange: new Date('2025-09-23T00:00:00Z'),
      untilTodayObj,
      todayObj,
      timezone,
    });

    const timeBars = result.timeBars;
    expect(timeBars.length).toBe(4);
    expect(timeBars).toEqual([
      {
        startOfRange: new Date('2025-09-19T22:00:00Z'),
        endOfRange: new Date('2025-09-20T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 200,
          pausedAmount: 2,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-09-20T00:00:00Z'),
        endOfRange: new Date('2025-09-21T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 150,
          pausedAmount: 1,
        },
        activityDistribution: [
          {
            ...aMeta,
            sessionStatistics: {
              sessionsAmount: 1,
              spentTimeSeconds: 50,
              pausedAmount: 1,
            },
          },
          {
            ...cMeta,
            sessionStatistics: {
              sessionsAmount: 0,
              spentTimeSeconds: 100,
              pausedAmount: 0,
            },
          },
        ],
      },
      {
        startOfRange: new Date('2025-09-21T00:00:00Z'),
        endOfRange: new Date('2025-09-22T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-09-22T00:00:00Z'),
        endOfRange: new Date('2025-09-23T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
    ]);
  });

  it('should create correct month time bars when the range starts a few days before today', () => {
    jest.spyOn(dateUtils, 'getTodayRange').mockReturnValue({
      startOfToday,
      startOfTomorrow,
    });

    const untilTodayObj: AnalyticsForRangeDTO = {
      sessionStatistics: {
        sessionsAmount: 3,
        spentTimeSeconds: 600,
        pausedAmount: 0,
      },
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2025-09-17T00:00:00Z'),
          endOfRange: new Date('2025-09-18T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 200,
            pausedAmount: 2,
          },
          activityDistribution: [
            {
              ...aMeta,
              sessionStatistics: {
                sessionsAmount: 1,
                spentTimeSeconds: 200,
                pausedAmount: 2,
              },
            },
          ],
        },
        {
          startOfRange: new Date('2025-09-18T00:00:00Z'),
          endOfRange: new Date('2025-09-19T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 200,
            pausedAmount: 3,
          },
          activityDistribution: [
            {
              ...aMeta,
              sessionStatistics: {
                sessionsAmount: 1,
                spentTimeSeconds: 200,
                pausedAmount: 3,
              },
            },
          ],
        },
        {
          startOfRange: new Date('2025-09-19T00:00:00Z'),
          endOfRange: new Date('2025-09-20T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 200,
            pausedAmount: 0,
          },
          activityDistribution: [
            {
              ...aMeta,
              sessionStatistics: {
                sessionsAmount: 1,
                spentTimeSeconds: 200,
                pausedAmount: 0,
              },
            },
          ],
        },
      ],
    };

    const result = analyticsService.mergeAnalytics({
      finalObjStartOfRange: new Date('2025-09-17T00:00:00Z'),
      finalObjEndOfRange: new Date('2026-01-01T00:00:00Z'),
      untilTodayObj,
      todayObj,
      timezone,
    });

    const timeBars = result.timeBars;
    expect(timeBars.length).toBe(4);
    expect(timeBars).toEqual([
      {
        startOfRange: new Date('2025-09-17T00:00:00Z'),
        endOfRange: new Date('2025-10-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 4,
          spentTimeSeconds: 750,
          pausedAmount: 6,
        },
        activityDistribution: [
          {
            ...aMeta,
            sessionStatistics: {
              sessionsAmount: 4,
              spentTimeSeconds: 650,
              pausedAmount: 6,
            },
          },
          {
            ...cMeta,
            sessionStatistics: {
              sessionsAmount: 0,
              spentTimeSeconds: 100,
              pausedAmount: 0,
            },
          },
        ],
      },
      {
        startOfRange: new Date('2025-10-01T00:00:00Z'),
        endOfRange: new Date('2025-11-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-11-01T00:00:00Z'),
        endOfRange: new Date('2025-12-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-12-01T00:00:00Z'),
        endOfRange: new Date('2026-01-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
    ]);
  });

  it('should create correct month time bars when the range starts yesterday', () => {
    jest.spyOn(dateUtils, 'getTodayRange').mockReturnValue({
      startOfToday,
      startOfTomorrow,
    });

    const untilTodayObj: AnalyticsForRangeDTO = {
      sessionStatistics: {
        sessionsAmount: 1,
        spentTimeSeconds: 100,
        pausedAmount: 3,
      },
      activityDistribution: [],
      timeBars: dayTimeBars,
    };

    const result = analyticsService.mergeAnalytics({
      finalObjStartOfRange: new Date('2025-09-19T00:00:00Z'),
      finalObjEndOfRange: new Date('2026-01-01T00:00:00Z'),
      untilTodayObj,
      todayObj,
      timezone,
    });

    const timeBars = result.timeBars;
    expect(timeBars.length).toBe(4);
    expect(timeBars).toEqual([
      {
        startOfRange: new Date('2025-09-19T00:00:00Z'),
        endOfRange: new Date('2025-10-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 2,
          spentTimeSeconds: 250,
          pausedAmount: 4,
        },
        activityDistribution: [
          {
            ...aMeta,
            sessionStatistics: {
              sessionsAmount: 1,
              spentTimeSeconds: 50,
              pausedAmount: 1,
            },
          },
          {
            ...cMeta,
            sessionStatistics: {
              sessionsAmount: 0,
              spentTimeSeconds: 100,
              pausedAmount: 0,
            },
          },
        ],
      },
      {
        startOfRange: new Date('2025-10-01T00:00:00Z'),
        endOfRange: new Date('2025-11-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-11-01T00:00:00Z'),
        endOfRange: new Date('2025-12-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-12-01T00:00:00Z'),
        endOfRange: new Date('2026-01-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
    ]);
  });

  it('should create correct month time bars when the range starts today', () => {
    jest.spyOn(dateUtils, 'getTodayRange').mockReturnValue({
      startOfToday,
      startOfTomorrow,
    });

    const untilTodayObj: AnalyticsForRangeDTO = {
      sessionStatistics: {
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        pausedAmount: 0,
      },
      activityDistribution: [],
      timeBars: [],
    };

    const result = analyticsService.mergeAnalytics({
      finalObjStartOfRange: new Date('2025-09-20T00:00:00Z'),
      finalObjEndOfRange: new Date('2026-01-01T00:00:00Z'),
      untilTodayObj,
      todayObj,
      timezone,
    });

    const timeBars = result.timeBars;
    expect(timeBars.length).toBe(4);
    expect(timeBars).toEqual([
      {
        startOfRange: new Date('2025-09-20T00:00:00Z'),
        endOfRange: new Date('2025-10-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 150,
          pausedAmount: 1,
        },
        activityDistribution: [
          {
            ...aMeta,
            sessionStatistics: {
              sessionsAmount: 1,
              spentTimeSeconds: 50,
              pausedAmount: 1,
            },
          },
          {
            ...cMeta,
            sessionStatistics: {
              sessionsAmount: 0,
              spentTimeSeconds: 100,
              pausedAmount: 0,
            },
          },
        ],
      },
      {
        startOfRange: new Date('2025-10-01T00:00:00Z'),
        endOfRange: new Date('2025-11-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-11-01T00:00:00Z'),
        endOfRange: new Date('2025-12-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-12-01T00:00:00Z'),
        endOfRange: new Date('2026-01-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
    ]);
  });

  it('should create correct month time bars when today if start of month and start of range is few days before today', () => {
    jest.spyOn(dateUtils, 'getTodayRange').mockReturnValue({
      startOfToday: new Date('2025-10-01T00:00:00Z'),
      startOfTomorrow: new Date('2025-10-02T:00:00:00Z'),
    });

    const untilTodayObj: AnalyticsForRangeDTO = {
      sessionStatistics: {
        sessionsAmount: 5,
        spentTimeSeconds: 500,
        pausedAmount: 2,
      },
      activityDistribution: [
        {
          ...aMeta,
          sessionStatistics: {
            sessionsAmount: 3,
            spentTimeSeconds: 300,
            pausedAmount: 2,
          },
        },
        {
          ...cMeta,
          sessionStatistics: {
            sessionsAmount: 2,
            spentTimeSeconds: 200,
            pausedAmount: 0,
          },
        },
      ],
      timeBars: [
        {
          startOfRange: new Date('2025-09-28T00:00:00Z'),
          endOfRange: new Date('2025-09-29T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 2,
            spentTimeSeconds: 200,
            pausedAmount: 0,
          },
          activityDistribution: [
            {
              ...aMeta,
              sessionStatistics: {
                sessionsAmount: 0,
                spentTimeSeconds: 0,
                pausedAmount: 0,
              },
            },
            {
              ...cMeta,
              sessionStatistics: {
                sessionsAmount: 1,
                spentTimeSeconds: 100,
                pausedAmount: 0,
              },
            },
          ],
        },
        {
          startOfRange: new Date('2025-09-29T00:00:00Z'),
          endOfRange: new Date('2025-09-30T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 3,
            spentTimeSeconds: 300,
            pausedAmount: 2,
          },
          activityDistribution: [
            {
              ...aMeta,
              sessionStatistics: {
                sessionsAmount: 3,
                spentTimeSeconds: 300,
                pausedAmount: 2,
              },
            },
            {
              ...cMeta,
              sessionStatistics: {
                sessionsAmount: 1,
                spentTimeSeconds: 100,
                pausedAmount: 0,
              },
            },
          ],
        },
        {
          startOfRange: new Date('2025-09-30T00:00:00Z'),
          endOfRange: new Date('2025-10-01T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 0,
            spentTimeSeconds: 0,
            pausedAmount: 0,
          },
          activityDistribution: [],
        },
      ],
    };

    const result = analyticsService.mergeAnalytics({
      finalObjStartOfRange: new Date('2025-09-28T00:00:00Z'),
      finalObjEndOfRange: new Date('2025-12-01T00:00:00Z'),
      untilTodayObj,
      todayObj,
      timezone,
    });

    const timeBars = result.timeBars;
    expect(timeBars.length).toBe(3);
    expect(timeBars).toEqual([
      {
        startOfRange: new Date('2025-09-28T00:00:00Z'),
        endOfRange: new Date('2025-10-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 5,
          spentTimeSeconds: 500,
          pausedAmount: 2,
        },
        activityDistribution: [
          {
            ...aMeta,
            sessionStatistics: {
              sessionsAmount: 3,
              spentTimeSeconds: 300,
              pausedAmount: 2,
            },
          },
          {
            ...cMeta,
            sessionStatistics: {
              sessionsAmount: 2,
              spentTimeSeconds: 200,
              pausedAmount: 0,
            },
          },
        ],
      },
      {
        startOfRange: new Date('2025-10-01T00:00:00Z'),
        endOfRange: new Date('2025-11-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 150,
          pausedAmount: 1,
        },
        activityDistribution: [
          {
            ...aMeta,
            sessionStatistics: {
              sessionsAmount: 1,
              spentTimeSeconds: 50,
              pausedAmount: 1,
            },
          },
          {
            ...cMeta,
            sessionStatistics: {
              sessionsAmount: 0,
              spentTimeSeconds: 100,
              pausedAmount: 0,
            },
          },
        ],
      },
      {
        startOfRange: new Date('2025-11-01T00:00:00Z'),
        endOfRange: new Date('2025-12-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 0,
          spentTimeSeconds: 0,
          pausedAmount: 0,
        },
        activityDistribution: [],
      },
    ]);
  });

  it('should create correct month time bars when today if start of month and start of range is few months before today', () => {
    jest.spyOn(dateUtils, 'getTodayRange').mockReturnValue({
      startOfToday: new Date('2025-10-01T00:00:00Z'),
      startOfTomorrow: new Date('2025-10-02T:00:00:00Z'),
    });

    const untilTodayObj: AnalyticsForRangeDTO = {
      sessionStatistics: {
        sessionsAmount: 5,
        spentTimeSeconds: 500,
        pausedAmount: 3,
      },
      activityDistribution: [
        {
          ...aMeta,
          sessionStatistics: {
            sessionsAmount: 3,
            spentTimeSeconds: 300,
            pausedAmount: 3,
          },
        },
        {
          ...cMeta,
          sessionStatistics: {
            sessionsAmount: 2,
            spentTimeSeconds: 200,
            pausedAmount: 0,
          },
        },
      ],
      timeBars: [
        {
          startOfRange: new Date('2025-08-01T00:00:00Z'),
          endOfRange: new Date('2025-09-01T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 3,
            spentTimeSeconds: 300,
            pausedAmount: 2,
          },
          activityDistribution: [
            {
              ...aMeta,
              sessionStatistics: {
                sessionsAmount: 3,
                spentTimeSeconds: 300,
                pausedAmount: 2,
              },
            },
            {
              ...cMeta,
              sessionStatistics: {
                sessionsAmount: 0,
                spentTimeSeconds: 0,
                pausedAmount: 0,
              },
            },
          ],
        },
        {
          startOfRange: new Date('2025-09-01T00:00:00Z'),
          endOfRange: new Date('2025-10-01T00:00:00Z'),
          sessionStatistics: {
            sessionsAmount: 2,
            spentTimeSeconds: 200,
            pausedAmount: 1,
          },
          activityDistribution: [
            {
              ...aMeta,
              sessionStatistics: {
                sessionsAmount: 0,
                spentTimeSeconds: 0,
                pausedAmount: 0,
              },
            },
            {
              ...cMeta,
              sessionStatistics: {
                sessionsAmount: 2,
                spentTimeSeconds: 200,
                pausedAmount: 1,
              },
            },
          ],
        },
      ],
    };

    const result = analyticsService.mergeAnalytics({
      finalObjStartOfRange: new Date('2025-08-01T00:00:00Z'),
      finalObjEndOfRange: new Date('2025-11-01T00:00:00Z'),
      untilTodayObj,
      todayObj,
      timezone,
    });

    const timeBars = result.timeBars;
    expect(timeBars.length).toBe(3);
    expect(timeBars).toEqual([
      {
        startOfRange: new Date('2025-08-01T00:00:00Z'),
        endOfRange: new Date('2025-09-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 3,
          spentTimeSeconds: 300,
          pausedAmount: 2,
        },
        activityDistribution: [
          {
            ...aMeta,
            sessionStatistics: {
              sessionsAmount: 3,
              spentTimeSeconds: 300,
              pausedAmount: 2,
            },
          },
          {
            ...cMeta,
            sessionStatistics: {
              sessionsAmount: 0,
              spentTimeSeconds: 0,
              pausedAmount: 0,
            },
          },
        ],
      },
      {
        startOfRange: new Date('2025-09-01T00:00:00Z'),
        endOfRange: new Date('2025-10-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 2,
          spentTimeSeconds: 200,
          pausedAmount: 1,
        },
        activityDistribution: [
          {
            ...aMeta,
            sessionStatistics: {
              sessionsAmount: 0,
              spentTimeSeconds: 0,
              pausedAmount: 0,
            },
          },
          {
            ...cMeta,
            sessionStatistics: {
              sessionsAmount: 2,
              spentTimeSeconds: 200,
              pausedAmount: 1,
            },
          },
        ],
      },
      {
        startOfRange: new Date('2025-10-01T00:00:00Z'),
        endOfRange: new Date('2025-11-01T00:00:00Z'),
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 150,
          pausedAmount: 1,
        },
        activityDistribution: [
          {
            ...aMeta,
            sessionStatistics: {
              sessionsAmount: 1,
              spentTimeSeconds: 50,
              pausedAmount: 1,
            },
          },
          {
            ...cMeta,
            sessionStatistics: {
              sessionsAmount: 0,
              spentTimeSeconds: 100,
              pausedAmount: 0,
            },
          },
        ],
      },
    ]);
  });
});

describe('analyticsService.buildUpdatedCacheValues', () => {
  it('should update activity name and color in activityDistribution (only in analytics containing the activity)', () => {
    const Aid = new Types.ObjectId();

    const firstAnalytics: AnalyticsForRangeDTO = {
      sessionStatistics: {
        sessionsAmount: 0,
        pausedAmount: 0,
        spentTimeSeconds: 0,
      },
      activityDistribution: [
        {
          id: Aid.toString(),
          name: 'A',
          color: 'Acolor',
          sessionStatistics: {
            sessionsAmount: 2,
            pausedAmount: 2,
            spentTimeSeconds: 120,
          },
        },
        {
          id: 'Bid',
          name: 'B',
          color: 'Bcolor',
          sessionStatistics: {
            sessionsAmount: 1,
            pausedAmount: 0,
            spentTimeSeconds: 60,
          },
        },
      ],
      timeBars: [],
    };
    const secondAnalytics: AnalyticsForRangeDTO = {
      sessionStatistics: {
        sessionsAmount: 3,
        pausedAmount: 1,
        spentTimeSeconds: 180,
      },
      activityDistribution: [
        {
          id: Aid.toString(),
          name: 'A',
          color: 'Acolor',
          sessionStatistics: {
            sessionsAmount: 5,
            pausedAmount: 4,
            spentTimeSeconds: 1000,
          },
        },
        {
          id: 'Cid',
          name: 'C',
          color: 'Ccolor',
          sessionStatistics: {
            sessionsAmount: 1,
            pausedAmount: 1,
            spentTimeSeconds: 30,
          },
        },
      ],
      timeBars: [],
    };
    const thirdAnalytics: AnalyticsForRangeDTO = {
      sessionStatistics: {
        sessionsAmount: 0,
        pausedAmount: 0,
        spentTimeSeconds: 0,
      },
      activityDistribution: [
        {
          id: 'Bid',
          name: 'B',
          color: 'Bcolor',
          sessionStatistics: {
            sessionsAmount: 1,
            pausedAmount: 0,
            spentTimeSeconds: 60,
          },
        },
        {
          id: 'Cid',
          name: 'C',
          color: 'Ccolor',
          sessionStatistics: {
            sessionsAmount: 1,
            pausedAmount: 1,
            spentTimeSeconds: 30,
          },
        },
      ],
      timeBars: [],
    };

    const cacheKeys: string[] = ['cacheKey1', 'cacheKey2', 'cacheKey3'];
    const cacheValues: string[] = [
      JSON.stringify(firstAnalytics),
      JSON.stringify(secondAnalytics),
      JSON.stringify(thirdAnalytics),
    ];
    const updatedActivity: IActivity = {
      _id: Aid,
      name: 'Aupdated',
      color: 'AcolorUpdated',

      descr: 'activity description',
      user: new Types.ObjectId('000000000000000000000001'),
      activityGroup: {
        _id: new Types.ObjectId('000000000000000000000010'),
        name: 'Default group',
      },
      createdDate: new Date('2024-01-01'),
      updatedDate: new Date('2024-02-01'),
      archived: false,
      deleted: false,
      sessionsAmount: 2,
      spentTimeSeconds: 120,
    };

    const result = analyticsService.buildUpdatedCacheValues(
      cacheKeys,
      cacheValues,
      {
        type: 'activityUpdated',
        activity: updatedActivity,
      },
    );
    expect(Object.keys(result).length).toBe(2);
    expect(result).toEqual({
      cacheKey1: JSON.stringify({
        ...firstAnalytics,
        activityDistribution: firstAnalytics.activityDistribution.map((ad) =>
          ad.id === Aid.toString()
            ? { ...ad, name: 'Aupdated', color: 'AcolorUpdated' }
            : ad,
        ),
      }),
      cacheKey2: JSON.stringify({
        ...secondAnalytics,
        activityDistribution: secondAnalytics.activityDistribution.map((ad) =>
          ad.id === Aid.toString()
            ? { ...ad, name: 'Aupdated', color: 'AcolorUpdated' }
            : ad,
        ),
      }),
    });
  });

  it('should update activity name and color in timeBars (and activityDistribution)', () => {
    const Aid = new Types.ObjectId();

    const firstAnalytics: AnalyticsForRangeDTO = {
      sessionStatistics: {
        sessionsAmount: 0,
        pausedAmount: 0,
        spentTimeSeconds: 0,
      },
      activityDistribution: [
        {
          id: Aid.toString(),
          name: 'A',
          color: 'Acolor',
          sessionStatistics: {
            sessionsAmount: 2,
            pausedAmount: 2,
            spentTimeSeconds: 120,
          },
        },
        {
          id: 'Bid',
          name: 'B',
          color: 'Bcolor',
          sessionStatistics: {
            sessionsAmount: 1,
            pausedAmount: 0,
            spentTimeSeconds: 60,
          },
        },
      ],
      timeBars: [
        {
          startOfRange: new Date(),
          endOfRange: new Date(),
          sessionStatistics: {
            sessionsAmount: 3,
            pausedAmount: 2,
            spentTimeSeconds: 180,
          },
          activityDistribution: [
            {
              id: Aid.toString(),
              name: 'A',
              color: 'Acolor',
              sessionStatistics: {
                sessionsAmount: 2,
                pausedAmount: 2,
                spentTimeSeconds: 120,
              },
            },
            {
              id: 'Bid',
              name: 'B',
              color: 'Bcolor',
              sessionStatistics: {
                sessionsAmount: 1,
                pausedAmount: 0,
                spentTimeSeconds: 60,
              },
            },
          ],
        },
      ],
    };
    const secondAnalytics: AnalyticsForRangeDTO = {
      sessionStatistics: {
        sessionsAmount: 3,
        pausedAmount: 1,
        spentTimeSeconds: 180,
      },
      activityDistribution: [
        {
          id: Aid.toString(),
          name: 'A',
          color: 'Acolor',
          sessionStatistics: {
            sessionsAmount: 5,
            pausedAmount: 4,
            spentTimeSeconds: 1000,
          },
        },
        {
          id: 'Cid',
          name: 'C',
          color: 'Ccolor',
          sessionStatistics: {
            sessionsAmount: 1,
            pausedAmount: 1,
            spentTimeSeconds: 30,
          },
        },
      ],
      timeBars: [
        {
          startOfRange: new Date(),
          endOfRange: new Date(),
          sessionStatistics: {
            sessionsAmount: 5,
            pausedAmount: 4,
            spentTimeSeconds: 1000,
          },
          activityDistribution: [
            {
              id: Aid.toString(),
              name: 'A',
              color: 'Acolor',
              sessionStatistics: {
                sessionsAmount: 5,
                pausedAmount: 4,
                spentTimeSeconds: 1000,
              },
            },
          ],
        },
        {
          startOfRange: new Date(),
          endOfRange: new Date(),
          sessionStatistics: {
            sessionsAmount: 1,
            pausedAmount: 1,
            spentTimeSeconds: 30,
          },
          activityDistribution: [
            {
              id: 'Cid',
              name: 'C',
              color: 'Ccolor',
              sessionStatistics: {
                sessionsAmount: 1,
                pausedAmount: 1,
                spentTimeSeconds: 30,
              },
            },
          ],
        },
      ],
    };
    const cacheKeys: string[] = ['cacheKey1', 'cacheKey2'];
    const cacheValues: string[] = [
      JSON.stringify(firstAnalytics),
      JSON.stringify(secondAnalytics),
    ];
    const updatedActivity: IActivity = {
      _id: Aid,
      name: 'Aupdated',
      color: 'AcolorUpdated',

      descr: 'activity description',
      user: new Types.ObjectId('000000000000000000000001'),
      activityGroup: {
        _id: new Types.ObjectId('000000000000000000000010'),
        name: 'Default group',
      },
      createdDate: new Date('2024-01-01'),
      updatedDate: new Date('2024-02-01'),
      archived: false,
      deleted: false,
      sessionsAmount: 2,
      spentTimeSeconds: 120,
    };

    const result = analyticsService.buildUpdatedCacheValues(
      cacheKeys,
      cacheValues,
      {
        type: 'activityUpdated',
        activity: updatedActivity,
      },
    );
    expect(Object.keys(result).length).toBe(2);
    expect(result).toEqual({
      cacheKey1: JSON.stringify({
        ...firstAnalytics,
        activityDistribution: firstAnalytics.activityDistribution.map((ad) =>
          ad.id === Aid.toString()
            ? { ...ad, name: 'Aupdated', color: 'AcolorUpdated' }
            : ad,
        ),
        timeBars: firstAnalytics.timeBars.map((bar) => ({
          ...bar,
          activityDistribution: bar.activityDistribution.map((ad) =>
            ad.id === Aid.toString()
              ? { ...ad, name: 'Aupdated', color: 'AcolorUpdated' }
              : ad,
          ),
        })),
      }),
      cacheKey2: JSON.stringify({
        ...secondAnalytics,
        activityDistribution: secondAnalytics.activityDistribution.map((ad) =>
          ad.id === Aid.toString()
            ? { ...ad, name: 'Aupdated', color: 'AcolorUpdated' }
            : ad,
        ),
        timeBars: secondAnalytics.timeBars.map((bar) => ({
          ...bar,
          activityDistribution: bar.activityDistribution.map((ad) =>
            ad.id === Aid.toString()
              ? { ...ad, name: 'Aupdated', color: 'AcolorUpdated' }
              : ad,
          ),
        })),
      }),
    });
  });

  it('should delete activity from activityDistribution and timeBars and reduce sessionStatistics overall and in timeBars (only in analytics containing the activity)', () => {
    const Aid = new Types.ObjectId();

    const firstAnalytics: AnalyticsForRangeDTO = {
      sessionStatistics: {
        sessionsAmount: 5,
        pausedAmount: 4,
        spentTimeSeconds: 240,
      },
      activityDistribution: [
        {
          id: Aid.toString(),
          name: 'A',
          color: 'Acolor',
          sessionStatistics: {
            sessionsAmount: 3,
            pausedAmount: 1,
            spentTimeSeconds: 180,
          },
        },
        {
          id: 'Bid',
          name: 'B',
          color: 'Bcolor',
          sessionStatistics: {
            sessionsAmount: 2,
            pausedAmount: 3,
            spentTimeSeconds: 60,
          },
        },
      ],
      timeBars: [
        {
          startOfRange: new Date(),
          endOfRange: new Date(),
          sessionStatistics: {
            sessionsAmount: 4,
            pausedAmount: 1,
            spentTimeSeconds: 150,
          },
          activityDistribution: [
            {
              id: Aid.toString(),
              name: 'A',
              color: 'Acolor',
              sessionStatistics: {
                sessionsAmount: 3,
                pausedAmount: 1,
                spentTimeSeconds: 100,
              },
            },
          ],
        },
      ],
    };
    const secondAnalytics: AnalyticsForRangeDTO = {
      sessionStatistics: {
        sessionsAmount: 5,
        pausedAmount: 4,
        spentTimeSeconds: 240,
      },
      activityDistribution: [
        {
          id: 'Bid',
          name: 'B',
          color: 'Bcolor',
          sessionStatistics: {
            sessionsAmount: 2,
            pausedAmount: 3,
            spentTimeSeconds: 60,
          },
        },
        {
          id: 'Cid',
          name: 'C',
          color: 'Ccolor',
          sessionStatistics: {
            sessionsAmount: 3,
            pausedAmount: 1,
            spentTimeSeconds: 180,
          },
        },
      ],
      timeBars: [],
    };
    const cacheKeys: string[] = ['cacheKey1', 'cacheKey2'];
    const cacheValues: string[] = [
      JSON.stringify(firstAnalytics),
      JSON.stringify(secondAnalytics),
    ];

    const result = analyticsService.buildUpdatedCacheValues(
      cacheKeys,
      cacheValues,
      { type: 'activityDeleted', activityId: Aid.toString() },
    );
    expect(Object.keys(result).length).toBe(1);
    expect(result).toEqual({
      cacheKey1: JSON.stringify({
        sessionStatistics: {
          sessionsAmount: 2,
          pausedAmount: 3,
          spentTimeSeconds: 60,
        },
        activityDistribution: firstAnalytics.activityDistribution.filter(
          (ad) => ad.id !== Aid.toString(),
        ),
        timeBars: firstAnalytics.timeBars.map((bar) => {
          const adIndex = bar.activityDistribution.findIndex(
            (ad) => ad.id === Aid.toString(),
          );
          if (adIndex === -1) {
            return bar;
          }

          return {
            ...bar,
            sessionStatistics: {
              sessionsAmount: 1,
              pausedAmount: 0,
              spentTimeSeconds: 50,
            },
            activityDistribution: bar.activityDistribution.filter(
              (ad) => ad.id !== Aid.toString(),
            ),
          };
        }),
      } as AnalyticsForRangeDTO),
    });
  });
});
