import analyticsService from '../../../service/analytics.service';
import { IActivity } from '../../../model/activity.model';
import { Types } from 'mongoose';
import { ISessionPart } from '../../../model/sessionPart.model';
import { ISession } from '../../../model/session.model';
import {
  ActivityDistribution,
  AnalyticsForRangeDTO,
  SessionStat,
  TimeBar,
  emptySessionStat,
} from '../../../dto/analytics.dto';

const mockActivityGroup = {
  _id: new Types.ObjectId(),
  id: new Types.ObjectId(),
  name: '',
};

describe('analyticsService.getSessionStat', () => {
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
        activity: {
          id: new Types.ObjectId(),
          name: 'Reading',
          activityGroup: mockActivityGroup,
        },
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
        activity: {
          id: new Types.ObjectId(),
          name: 'Coding',
          activityGroup: mockActivityGroup,
        },
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

  it('returns "month" when range is exactly 366 days', () => {
    const start = new Date(2020, 0, 1); // Jan 1, 2020
    const end = new Date(2021, 0, 1); // Jan 1, 2021
    expect(analyticsService.getTimeBarType(start, end)).toBe('month');
  });

  it('returns "year" when range is more than 366 days', () => {
    const start = new Date(2020, 0, 1); // Jan 1, 2020
    const end = new Date(2022, 0, 1); // Feb 2, 2022 (~763 days)
    expect(analyticsService.getTimeBarType(start, end)).toBe('year');
  });
});

describe('analyticsService.getTimeBars', () => {
  it('should return correct hour-based time bars', () => {
    const start = new Date('2025-12-29T00:00:00Z');
    const end = new Date('2025-12-29T12:00:00Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      barType: 'hour',
      dataSource: {
        type: 'raw',
        sessionParts: [],
        completedSessions: [],
      },
      timezone: 'UTC',
      userActivities: [],
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
      barType: 'hour',
      dataSource: {
        type: 'raw',
        sessionParts: [],
        completedSessions: [],
      },
      timezone: 'UTC',
      userActivities: [],
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
      barType: 'hour',
      dataSource: {
        type: 'raw',
        sessionParts: [],
        completedSessions: [],
      },
      timezone: 'UTC',
      userActivities: [],
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
      barType: 'day',
      dataSource: {
        type: 'raw',
        sessionParts: [],
        completedSessions: [],
      },
      timezone: 'UTC',
      userActivities: [],
    });

    expect(result).toHaveLength(2);

    expect(result[0].startOfRange).toEqual(new Date('2025-07-01T00:00:00Z'));
    expect(result[0].endOfRange).toEqual(new Date('2025-07-02T00:00:00Z'));

    expect(result[1].startOfRange).toEqual(new Date('2025-07-02T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-07-03T00:00:00Z'));
  });

  it('should return correct day-based time bars and cut last period to end of range', () => {
    const start = new Date('2025-07-01T00:00:00Z');
    const end = new Date('2025-07-02T18:00:00Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      barType: 'day',
      dataSource: {
        type: 'raw',
        sessionParts: [],
        completedSessions: [],
      },
      timezone: 'UTC',
      userActivities: [],
    });

    expect(result).toHaveLength(2);

    expect(result[0].startOfRange).toEqual(new Date('2025-07-01T00:00:00Z'));
    expect(result[0].endOfRange).toEqual(new Date('2025-07-02T00:00:00Z'));

    expect(result[1].startOfRange).toEqual(new Date('2025-07-02T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-07-02T18:00:00Z'));
  });

  it('should split time bars correctly when range starts mid-day', () => {
    const start = new Date('2025-07-01T12:00:00Z');
    const end = new Date('2025-07-03T00:00:00Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      barType: 'day',
      dataSource: {
        type: 'raw',
        sessionParts: [],
        completedSessions: [],
      },
      timezone: 'UTC',
      userActivities: [],
    });

    expect(result).toHaveLength(2);

    expect(result[0].startOfRange).toEqual(new Date('2025-07-01T12:00:00Z'));
    expect(result[0].endOfRange).toEqual(new Date('2025-07-02T00:00:00Z'));

    expect(result[1].startOfRange).toEqual(new Date('2025-07-02T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-07-03T00:00:00Z'));
  });

  it('should return correct month-based time bars', () => {
    const start = new Date('2025-07-01T00:00:00Z');
    const end = new Date('2025-09-01T00:00:00Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      barType: 'month',
      dataSource: {
        type: 'raw',
        sessionParts: [],
        completedSessions: [],
      },
      timezone: 'UTC',
      userActivities: [],
    });

    expect(result).toHaveLength(2);

    expect(result[0].startOfRange).toEqual(new Date('2025-07-01T00:00:00Z'));
    expect(result[0].endOfRange).toEqual(new Date('2025-08-01T00:00:00Z'));

    expect(result[1].startOfRange).toEqual(new Date('2025-08-01T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-09-01T00:00:00Z'));
  });

  it('should return correct month-based time bars and cut last period to end of range', () => {
    const start = new Date('2025-07-01T00:00:00Z');
    const end = new Date('2025-08-10T00:00:00Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      barType: 'month',
      dataSource: {
        type: 'raw',
        sessionParts: [],
        completedSessions: [],
      },
      timezone: 'UTC',
      userActivities: [],
    });

    expect(result).toHaveLength(2);

    expect(result[0].startOfRange).toEqual(new Date('2025-07-01T00:00:00Z'));
    expect(result[0].endOfRange).toEqual(new Date('2025-08-01T00:00:00Z'));

    expect(result[1].startOfRange).toEqual(new Date('2025-08-01T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-08-10T00:00:00Z'));
  });

  it('should split month time bars correctly when range starts mid-month', () => {
    const start = new Date('2025-05-10T12:00:00Z');
    const end = new Date('2025-07-01T00:00:00Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      barType: 'month',
      dataSource: {
        type: 'raw',
        sessionParts: [],
        completedSessions: [],
      },
      timezone: 'UTC',
      userActivities: [],
    });

    expect(result).toHaveLength(2);

    expect(result[0].startOfRange).toEqual(new Date('2025-05-10T12:00:00Z'));
    expect(result[0].endOfRange).toEqual(new Date('2025-06-01T00:00:00Z'));

    expect(result[1].startOfRange).toEqual(new Date('2025-06-01T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-07-01T00:00:00Z'));
  });

  it('should split month time bars correctly when working with other timezone', () => {
    const start = new Date('2024-06-30T21:00:00.000Z');
    const end = new Date('2024-12-31T21:00:00.000Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      barType: 'month',
      dataSource: {
        type: 'raw',
        sessionParts: [],
        completedSessions: [],
      },
      timezone: 'Europe/Moscow',
      userActivities: [],
    });

    expect(result.length).toBe(6);

    expect(result[0].startOfRange).toEqual(
      new Date('2024-06-30T21:00:00.000Z'),
    );
    expect(result[0].endOfRange).toEqual(new Date('2024-07-31T21:00:00.000Z'));

    expect(result[1].startOfRange).toEqual(
      new Date('2024-07-31T21:00:00.000Z'),
    );
    expect(result[1].endOfRange).toEqual(new Date('2024-08-31T21:00:00.000Z'));

    expect(result[2].startOfRange).toEqual(
      new Date('2024-08-31T21:00:00.000Z'),
    );
    expect(result[2].endOfRange).toEqual(new Date('2024-09-30T21:00:00.000Z'));

    expect(result[3].startOfRange).toEqual(
      new Date('2024-09-30T21:00:00.000Z'),
    );
    expect(result[3].endOfRange).toEqual(new Date('2024-10-31T21:00:00.000Z'));

    expect(result[4].startOfRange).toEqual(
      new Date('2024-10-31T21:00:00.000Z'),
    );
    expect(result[4].endOfRange).toEqual(new Date('2024-11-30T21:00:00.000Z'));

    expect(result[5].startOfRange).toEqual(
      new Date('2024-11-30T21:00:00.000Z'),
    );
    expect(result[5].endOfRange).toEqual(new Date('2024-12-31T21:00:00.000Z'));
  });

  it('should return yearly time bars when the range starts at the beginning of a year', () => {
    const start = new Date('2024-01-01T00:00:00.000Z');
    const end = new Date('2026-01-01T00:00:00.000Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      barType: 'year',
      dataSource: {
        type: 'raw',
        sessionParts: [],
        completedSessions: [],
      },
      timezone: 'UTC',
      userActivities: [],
    });

    expect(result).toHaveLength(2);

    expect(result[0].startOfRange).toEqual(new Date('2024-01-01T00:00:00Z'));
    expect(result[0].endOfRange).toEqual(new Date('2025-01-01T00:00:00Z'));

    expect(result[1].startOfRange).toEqual(new Date('2025-01-01T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2026-01-01T00:00:00Z'));
  });

  it('should return yearly time bars when the range starts after the beginning of a year', () => {
    const start = new Date('2024-06-01T00:00:00.000Z');
    const end = new Date('2026-01-01T00:00:00.000Z');

    const result = analyticsService.getTimeBars({
      startOfRange: start,
      endOfRange: end,
      barType: 'year',
      dataSource: {
        type: 'raw',
        sessionParts: [],
        completedSessions: [],
      },
      timezone: 'UTC',
      userActivities: [],
    });

    expect(result).toHaveLength(2);

    expect(result[0].startOfRange).toEqual(new Date('2024-06-01T00:00:00Z'));
    expect(result[0].endOfRange).toEqual(new Date('2025-01-01T00:00:00Z'));

    expect(result[1].startOfRange).toEqual(new Date('2025-01-01T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2026-01-01T00:00:00Z'));
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
      activityGroup: mockActivityGroup,
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
      activityGroup: mockActivityGroup,
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
        activity: {
          id: readingMeta._id,
          name: readingMeta.name,
          activityGroup: mockActivityGroup,
        },
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
        activity: {
          id: readingMeta._id,
          name: readingMeta.name,
          activityGroup: mockActivityGroup,
        },
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
        activity: {
          id: codingMeta._id,
          name: codingMeta.name,
          activityGroup: mockActivityGroup,
        },
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
      totalStat: {
        sessionsAmount: 4,
        spentTimeSeconds: 600,
        pausedAmount: 2,
      },
      sessionParts,
      completedSessions,
      userActivities: mockActivities,
    });

    expect(result).toEqual([
      {
        ...readingAdMeta,
        name: 'Reading',
        color: '#fff000',
        sessionStat: {
          spentTimeSeconds: 100,
          sessionsAmount: 2,
          pausedAmount: 1,
        },
      },
      {
        ...codingAdMeta,
        sessionStat: {
          spentTimeSeconds: 400,
          sessionsAmount: 1,
          pausedAmount: 1,
        },
      },
      {
        id: '0',
        name: 'Without activity',
        color: '#9CA3AF',
        sessionStat: {
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
        activity: {
          id: readingMeta._id,
          name: readingMeta.name,
          activityGroup: mockActivityGroup,
        },
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
      totalStat: {
        sessionsAmount: 1,
        spentTimeSeconds: 300,
        pausedAmount: 0,
      },
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

describe('analyticsService.mergeSessionStat', () => {
  it('correctly sums statistics from multiple entries', () => {
    const input: SessionStat[] = [
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

    const result = analyticsService.mergeSessionStat(input);

    expect(result).toEqual({
      sessionsAmount: 5,
      spentTimeSeconds: 420,
      pausedAmount: 3,
    });
  });

  it('returns zeros when an empty array is provided', () => {
    const result = analyticsService.mergeSessionStat([]);

    expect(result).toEqual(emptySessionStat);
  });

  it('correctly handles a single entry', () => {
    const input: SessionStat[] = [
      {
        sessionsAmount: 1,
        spentTimeSeconds: 60,
        pausedAmount: 0,
      },
    ];

    const result = analyticsService.mergeSessionStat(input);

    expect(result).toEqual({
      sessionsAmount: 1,
      spentTimeSeconds: 60,
      pausedAmount: 0,
    });
  });

  it('correctly sums zero values', () => {
    const input: SessionStat[] = [emptySessionStat, emptySessionStat];

    const result = analyticsService.mergeSessionStat(input);

    expect(result).toEqual(emptySessionStat);
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
      sessionStat: {
        sessionsAmount: 1,
        spentTimeSeconds: 100,
        pausedAmount: 1,
      },
    },
    {
      ...bMeta,
      sessionStat: {
        sessionsAmount: 1,
        spentTimeSeconds: 200,
        pausedAmount: 0,
      },
    },
  ];
  const secondAd: ActivityDistribution[] = [
    {
      ...aMeta,
      sessionStat: {
        sessionsAmount: 1,
        spentTimeSeconds: 50,
        pausedAmount: 1,
      },
    },
    {
      ...cMeta,
      sessionStat: {
        sessionsAmount: 1,
        spentTimeSeconds: 100,
        pausedAmount: 2,
      },
    },
  ];
  const thirdAd: ActivityDistribution[] = [
    {
      ...aMeta,
      sessionStat: {
        sessionsAmount: 1,
        spentTimeSeconds: 50,
        pausedAmount: 0,
      },
    },
    {
      ...bMeta,
      sessionStat: {
        sessionsAmount: 2,
        spentTimeSeconds: 200,
        pausedAmount: 0,
      },
    },
    {
      ...dMeta,
      sessionStat: {
        sessionsAmount: 1,
        spentTimeSeconds: 100,
        pausedAmount: 0,
      },
    },
  ];
  const fourthAd: ActivityDistribution[] = [
    {
      ...bMeta,
      sessionStat: {
        sessionsAmount: 2,
        spentTimeSeconds: 100,
        pausedAmount: 0,
      },
    },
    {
      ...dMeta,
      sessionStat: {
        sessionsAmount: 0,
        spentTimeSeconds: 300,
        pausedAmount: 1,
      },
    },
    {
      ...eMeta,
      sessionStat: {
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
      sessionStat: {
        sessionsAmount: 2,
        spentTimeSeconds: 150,
        pausedAmount: 2,
      },
    });

    const activityB = result.find((a) => a.id === bMeta.id);
    expect(activityB).toEqual({
      ...bMeta,
      sessionStat: {
        sessionsAmount: 1,
        spentTimeSeconds: 200,
        pausedAmount: 0,
      },
    });

    const activityC = result.find((a) => a.id === cMeta.id);
    expect(activityC).toEqual({
      ...cMeta,
      sessionStat: {
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
      sessionStat: {
        sessionsAmount: 3,
        spentTimeSeconds: 200,
        pausedAmount: 2,
      },
    });

    const activityB = result.find((a) => a.id === bMeta.id);
    expect(activityB).toEqual({
      ...bMeta,
      sessionStat: {
        sessionsAmount: 5,
        spentTimeSeconds: 500,
        pausedAmount: 0,
      },
    });

    const activityC = result.find((a) => a.id === cMeta.id);
    expect(activityC).toEqual({
      ...cMeta,
      sessionStat: {
        sessionsAmount: 1,
        spentTimeSeconds: 100,
        pausedAmount: 2,
      },
    });

    const activityD = result.find((a) => a.id === dMeta.id);
    expect(activityD).toEqual({
      ...dMeta,
      sessionStat: {
        sessionsAmount: 1,
        spentTimeSeconds: 400,
        pausedAmount: 1,
      },
    });

    const activityE = result.find((a) => a.id === eMeta.id);
    expect(activityE).toEqual({
      ...eMeta,
      sessionStat: {
        sessionsAmount: 2,
        spentTimeSeconds: 200,
        pausedAmount: 0,
      },
    });
  });
});

describe('analyticsService.mergeBarsWithDailyRangeOnLeft', () => {
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

  const leftObjStat: SessionStat = {
    sessionsAmount: 2,
    spentTimeSeconds: 60,
    pausedAmount: 1,
  };
  const leftObjAds = [
    {
      ...aMeta,
      sessionStat: {
        sessionsAmount: 1,
        spentTimeSeconds: 40,
        pausedAmount: 1,
      },
    },
    {
      ...bMeta,
      sessionStat: {
        sessionsAmount: 1,
        spentTimeSeconds: 20,
        pausedAmount: 0,
      },
    },
  ];

  const leftObj: AnalyticsForRangeDTO = {
    startOfRange: new Date('2025-09-20T21:00:00Z'),
    endOfRange: new Date('2025-09-21T00:00:00Z'),
    sessionStat: leftObjStat,
    activityDistribution: leftObjAds,
    timeBars: [
      {
        startOfRange: new Date('2025-09-20T21:00:00Z'),
        endOfRange: new Date('2025-09-20T22:00:00Z'),
        sessionStat: emptySessionStat,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-09-20T22:00:00Z'),
        endOfRange: new Date('2025-09-20T23:00:00Z'),
        sessionStat: emptySessionStat,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-09-20T23:00:00Z'),
        endOfRange: new Date('2025-09-21T00:00:00Z'),
        sessionStat: emptySessionStat,
        activityDistribution: [],
      },
    ],
  };

  it('should throw error if left object is longer than day', () => {
    const leftObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2025-09-20T00:00:00Z'),
      endOfRange: new Date('2025-11-01T00:00:00Z'),
      sessionStat: emptySessionStat,
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2025-09-20T00:00:00Z'),
          endOfRange: new Date('2025-10-01T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-10-01T00:00:00Z'),
          endOfRange: new Date('2025-11-01T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
      ],
    };

    const rightObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2025-11-01T00:00:00Z'),
      endOfRange: new Date('2025-12-01T00:00:00Z'),
      sessionStat: emptySessionStat,
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2025-11-01T00:00:00Z'),
          endOfRange: new Date('2025-12-01T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
      ],
    };

    try {
      analyticsService.mergeBarsWithDailyRangeOnLeft({
        leftObj,
        rightObj,
      });
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });

  it('should merge all time bars if final range bar type is hour', () => {
    const leftObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2025-09-20T22:00:00Z'),
      endOfRange: new Date('2025-09-21T00:00:00Z'),
      sessionStat: emptySessionStat,
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2025-09-20T22:00:00Z'),
          endOfRange: new Date('2025-09-20T23:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-09-20T23:00:00Z'),
          endOfRange: new Date('2025-09-21T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
      ],
    };
    const rightObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2025-09-21T00:00:00Z'),
      endOfRange: new Date('2025-09-21T03:00:00Z'),
      sessionStat: emptySessionStat,
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2025-09-21T00:00:00Z'),
          endOfRange: new Date('2025-09-21T01:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-09-21T01:00:00Z'),
          endOfRange: new Date('2025-09-21T02:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-09-21T02:00:00Z'),
          endOfRange: new Date('2025-09-21T03:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
      ],
    };

    const result = analyticsService.mergeBarsWithDailyRangeOnLeft({
      leftObj,
      rightObj,
    });
    expect(result.length).toBe(5);
  });

  it('if bar type is hour on the right, should create proper left and right time bars and combine them', () => {
    const leftObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2025-09-20T00:00:00Z'),
      endOfRange: new Date('2025-09-21T00:00:00Z'),
      sessionStat: leftObjStat,
      activityDistribution: leftObjAds,
      timeBars: [
        // expecting that there are 24 bars until 2025-09-21T00:00:00Z
      ],
    };

    const rightObjStat: SessionStat = {
      sessionsAmount: 1,
      spentTimeSeconds: 65,
      pausedAmount: 3,
    };
    const rightObjAds: ActivityDistribution[] = [
      {
        ...aMeta,
        sessionStat: {
          sessionsAmount: 1,
          spentTimeSeconds: 65,
          pausedAmount: 3,
        },
      },
    ];
    const rightObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2025-09-21T00:00:00Z'),
      endOfRange: new Date('2025-09-21T03:00:00Z'),
      sessionStat: rightObjStat,
      activityDistribution: rightObjAds,
      timeBars: [
        {
          startOfRange: new Date('2025-09-21T00:00:00Z'),
          endOfRange: new Date('2025-09-21T01:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-09-21T01:00:00Z'),
          endOfRange: new Date('2025-09-21T02:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-09-21T02:00:00Z'),
          endOfRange: new Date('2025-09-21T03:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
      ],
    };

    const result = analyticsService.mergeBarsWithDailyRangeOnLeft({
      leftObj,
      rightObj,
    });
    expect(result.length).toBe(2);
    expect(result[0]).toEqual({
      startOfRange: new Date('2025-09-20T00:00:00Z'),
      endOfRange: new Date('2025-09-21T00:00:00Z'),
      sessionStat: leftObjStat,
      activityDistribution: [...leftObjAds],
    });
    expect(result[1]).toEqual({
      startOfRange: new Date('2025-09-21T00:00:00Z'),
      endOfRange: new Date('2025-09-21T03:00:00Z'),
      sessionStat: rightObjStat,
      activityDistribution: [...rightObjAds],
    });
  });

  it('if bar type is day on the right, should create proper left time bar and merge it with right obj time bars', () => {
    const rightObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2025-09-21T00:00:00Z'),
      endOfRange: new Date('2025-09-24T00:00:00Z'),
      sessionStat: emptySessionStat,
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2025-09-21T00:00:00Z'),
          endOfRange: new Date('2025-09-22T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-09-22T00:00:00Z'),
          endOfRange: new Date('2025-09-23T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-09-23T00:00:00Z'),
          endOfRange: new Date('2025-09-24T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
      ],
    };

    const result = analyticsService.mergeBarsWithDailyRangeOnLeft({
      leftObj,
      rightObj,
    });
    expect(result.length).toBe(4);
    expect(result[0]).toEqual({
      startOfRange: new Date('2025-09-20T21:00:00Z'),
      endOfRange: new Date('2025-09-21T00:00:00Z'),
      sessionStat: leftObjStat,
      activityDistribution: [...leftObjAds],
    });
  });

  it('if bar type is month or year on the right, should properly change first time bar on the right', () => {
    const rightObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2025-09-21T00:00:00Z'),
      endOfRange: new Date('2026-01-01T00:00:00Z'),
      sessionStat: emptySessionStat,
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2025-09-21T00:00:00Z'),
          endOfRange: new Date('2025-10-01T00:00:00Z'),
          sessionStat: {
            sessionsAmount: 3,
            spentTimeSeconds: 60,
            pausedAmount: 2,
          },
          activityDistribution: [
            {
              ...aMeta,
              sessionStat: {
                sessionsAmount: 3,
                spentTimeSeconds: 60,
                pausedAmount: 2,
              },
            },
          ],
        },
        {
          startOfRange: new Date('2025-10-01T00:00:00Z'),
          endOfRange: new Date('2025-11-01T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-11-01T00:00:00Z'),
          endOfRange: new Date('2025-12-01T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-12-01T00:00:00Z'),
          endOfRange: new Date('2026-01-01T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
      ],
    };

    const result = analyticsService.mergeBarsWithDailyRangeOnLeft({
      leftObj,
      rightObj,
    });
    expect(result.length).toBe(4);
    expect(result[0]).toEqual({
      startOfRange: new Date('2025-09-20T21:00:00Z'),
      endOfRange: new Date('2025-10-01T00:00:00Z'),
      sessionStat: {
        sessionsAmount: 5,
        spentTimeSeconds: 120,
        pausedAmount: 3,
      },
      activityDistribution: [
        {
          ...aMeta,
          sessionStat: {
            sessionsAmount: 4,
            spentTimeSeconds: 100,
            pausedAmount: 3,
          },
        },
        {
          ...bMeta,
          sessionStat: {
            sessionsAmount: 1,
            spentTimeSeconds: 20,
            pausedAmount: 0,
          },
        },
      ],
    });
  });
});

describe('analyticsService.mergeBarsWithDailyRangeOnRight', () => {
  const timezone = 'UTC';
  const aMeta = {
    id: new Types.ObjectId().toString(),
    name: 'A',
    color: '#aaa000',
  };

  const rightObjBars: TimeBar[] = Array.from({ length: 24 }, (_, h) => ({
    startOfRange: new Date(`2026-06-20T${String(h).padStart(2, '0')}:00:00Z`),
    endOfRange: new Date(`2026-06-20T${String(h + 1).padStart(2, '0')}:00:00Z`),
    sessionStat: emptySessionStat,
    activityDistribution: [],
  }));
  const rightObjStat: SessionStat = {
    sessionsAmount: 3,
    spentTimeSeconds: 75,
    pausedAmount: 2,
  };
  const rightObj: AnalyticsForRangeDTO = {
    startOfRange: new Date('2026-06-20T00:00:00Z'),
    endOfRange: new Date('2026-06-21T00:00:00Z'),
    sessionStat: rightObjStat,
    activityDistribution: [{ ...aMeta, sessionStat: rightObjStat }],
    timeBars: rightObjBars,
  };

  it('should throw error if right object is longer than day', () => {
    const leftObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2025-09-20T00:00:00Z'),
      endOfRange: new Date('2025-11-01T00:00:00Z'),
      sessionStat: emptySessionStat,
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2025-09-20T00:00:00Z'),
          endOfRange: new Date('2025-10-01T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-10-01T00:00:00Z'),
          endOfRange: new Date('2025-11-01T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
      ],
    };

    const rightObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2025-11-01T00:00:00Z'),
      endOfRange: new Date('2025-12-01T00:00:00Z'),
      sessionStat: emptySessionStat,
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2025-11-01T00:00:00Z'),
          endOfRange: new Date('2025-12-01T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
      ],
    };
    const finalObjEndOfRange = rightObj.endOfRange;

    try {
      analyticsService.mergeBarsWithDailyRangeOnRight({
        leftObj,
        rightObj,
        finalObjEndOfRange,
        timezone,
      });
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });

  it('if final bar type is hour, should combine left and right time bars', () => {
    const leftObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2026-06-20T22:00:00Z'),
      endOfRange: new Date('2026-06-21T00:00:00Z'),
      sessionStat: emptySessionStat,
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2026-06-20T22:00:00Z'),
          endOfRange: new Date('2026-06-20T23:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2026-06-20T23:00:00Z'),
          endOfRange: new Date('2026-06-21T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
      ],
    };

    const rightObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2026-06-21T00:00:00Z'),
      endOfRange: new Date('2026-06-21T02:00:00Z'),
      sessionStat: emptySessionStat,
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2026-06-21T00:00:00Z'),
          endOfRange: new Date('2026-06-21T01:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2026-06-21T01:00:00Z'),
          endOfRange: new Date('2026-06-21T02:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
      ],
    };

    const result = analyticsService.mergeBarsWithDailyRangeOnRight({
      leftObj,
      rightObj,
      finalObjEndOfRange: rightObj.endOfRange,
      timezone,
    });
    expect(result.length).toBe(4);
  });

  it('if final bar type is day and bar type is hour on the left, should create proper left time bar', () => {
    const leftObjStat = {
      sessionsAmount: 1,
      spentTimeSeconds: 40,
      pausedAmount: 2,
    };
    const leftObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2026-06-19T22:00:00Z'),
      endOfRange: new Date('2026-06-20T00:00:00Z'),
      sessionStat: leftObjStat,
      activityDistribution: [{ ...aMeta, sessionStat: leftObjStat }],
      timeBars: [
        {
          startOfRange: new Date('2026-06-19T22:00:00Z'),
          endOfRange: new Date('2026-06-19T23:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2026-06-19T23:00:00Z'),
          endOfRange: new Date('2026-06-20T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
      ],
    };

    const result = analyticsService.mergeBarsWithDailyRangeOnRight({
      leftObj,
      rightObj,
      finalObjEndOfRange: rightObj.endOfRange,
      timezone,
    });
    expect(result.length).toBe(2);
    expect(result[0]).toEqual({
      startOfRange: leftObj.startOfRange,
      endOfRange: leftObj.endOfRange,
      sessionStat: leftObjStat,
      activityDistribution: [{ ...aMeta, sessionStat: leftObjStat }],
    });
    expect(result[1]).toEqual({
      startOfRange: rightObj.startOfRange,
      endOfRange: rightObj.endOfRange,
      sessionStat: rightObjStat,
      activityDistribution: [{ ...aMeta, sessionStat: rightObjStat }],
    });
  });

  it('if final bar type is day and bar type is day on the left, should properly combine left time bars with created right bar', () => {
    const leftObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2026-06-18T00:00:00Z'),
      endOfRange: new Date('2026-06-20T00:00:00Z'),
      sessionStat: emptySessionStat,
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2026-06-18T00:00:00Z'),
          endOfRange: new Date('2026-06-19T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2026-06-19T00:00:00Z'),
          endOfRange: new Date('2026-06-20T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
      ],
    };

    const result = analyticsService.mergeBarsWithDailyRangeOnRight({
      leftObj,
      rightObj,
      finalObjEndOfRange: rightObj.endOfRange,
      timezone,
    });
    expect(result.length).toBe(3);
  });

  it('if final bar type is day and finalObjEndOfRange is later than range end of right obj, should add empty day time bars', () => {
    const leftObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2026-06-19T00:00:00Z'),
      endOfRange: new Date('2026-06-20T00:00:00Z'),
      sessionStat: emptySessionStat,
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2026-06-19T00:00:00Z'),
          endOfRange: new Date('2026-06-20T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
      ],
    };

    const result = analyticsService.mergeBarsWithDailyRangeOnRight({
      leftObj,
      rightObj,
      finalObjEndOfRange: new Date('2026-06-30T00:00:00Z'),
      timezone,
    });
    expect(result.length).toBe(11);
  });

  it('if final bar type is month and bar type is hour/day on the left, should properly create left bar and empty bars', () => {
    const leftObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2026-06-19T22:00:00Z'),
      endOfRange: new Date('2026-06-20T00:00:00Z'),
      sessionStat: {
        sessionsAmount: 5,
        spentTimeSeconds: 30,
        pausedAmount: 2,
      },
      activityDistribution: [
        {
          ...aMeta,
          sessionStat: {
            sessionsAmount: 5,
            spentTimeSeconds: 30,
            pausedAmount: 2,
          },
        },
      ],
      timeBars: [
        {
          startOfRange: new Date('2026-06-19T22:00:00Z'),
          endOfRange: new Date('2026-06-19T23:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2026-06-19T23:00:00Z'),
          endOfRange: new Date('2026-06-20T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
      ],
    };

    const result = analyticsService.mergeBarsWithDailyRangeOnRight({
      leftObj,
      rightObj,
      timezone,
      finalObjEndOfRange: new Date('2026-08-01T00:00:00Z'),
    });
    expect(result.length).toBe(2);
    expect(result[0]).toEqual({
      startOfRange: leftObj.startOfRange,
      endOfRange: new Date('2026-07-01T00:00:00Z'),
      sessionStat: {
        sessionsAmount: 8,
        spentTimeSeconds: 105,
        pausedAmount: 4,
      },
      activityDistribution: [
        {
          ...aMeta,
          sessionStat: {
            sessionsAmount: 8,
            spentTimeSeconds: 105,
            pausedAmount: 4,
          },
        },
      ],
    } as TimeBar);
    expect(result[1].startOfRange).toEqual(new Date('2026-07-01T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2026-08-01T00:00:00Z'));
  });

  it('if final bar type is month, bar type is month on the left, should properly combine left bars with right obj', () => {
    const leftObjStat: SessionStat = {
      sessionsAmount: 2,
      spentTimeSeconds: 60,
      pausedAmount: 2,
    };
    const leftBarStat: SessionStat = {
      sessionsAmount: 1,
      spentTimeSeconds: 40,
      pausedAmount: 2,
    };
    const leftObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2026-05-01T00:00:00Z'),
      endOfRange: new Date('2026-06-20T00:00:00Z'),
      sessionStat: leftObjStat,
      activityDistribution: [{ ...aMeta, sessionStat: leftObjStat }],
      timeBars: [
        {
          startOfRange: new Date('2026-05-01T00:00:00Z'),
          endOfRange: new Date('2026-06-01T00:00:00Z'),
          sessionStat: leftBarStat,
          activityDistribution: [{ ...aMeta, sessionStat: leftBarStat }],
        },
        {
          startOfRange: new Date('2026-06-01T00:00:00Z'),
          endOfRange: new Date('2026-06-20T00:00:00Z'),
          sessionStat: {
            sessionsAmount: 1,
            spentTimeSeconds: 20,
            pausedAmount: 0,
          },
          activityDistribution: [
            {
              ...aMeta,
              sessionStat: {
                sessionsAmount: 1,
                spentTimeSeconds: 20,
                pausedAmount: 0,
              },
            },
          ],
        },
      ],
    };

    const expectedResultStat: SessionStat = {
      sessionsAmount: 4,
      spentTimeSeconds: 95,
      pausedAmount: 2,
    };

    // if finalObjEndOfRange is the same as rightObj.endOfRange
    let result = analyticsService.mergeBarsWithDailyRangeOnRight({
      leftObj,
      rightObj,
      timezone,
      finalObjEndOfRange: rightObj.endOfRange,
    });
    expect(result.length).toBe(2);
    expect(result[1]).toEqual({
      startOfRange: new Date('2026-06-01T00:00:00Z'),
      endOfRange: rightObj.endOfRange,
      sessionStat: expectedResultStat,
      activityDistribution: [
        {
          ...aMeta,
          sessionStat: expectedResultStat,
        },
      ],
    } as TimeBar);

    // if finalObjEndOfRange is later than rightObj.endOfRange but earlier than start of the next month
    result = analyticsService.mergeBarsWithDailyRangeOnRight({
      leftObj,
      rightObj,
      timezone,
      finalObjEndOfRange: new Date('2026-06-25T00:00:00Z'),
    });
    expect(result.length).toBe(2);
    expect(result[1]).toEqual({
      startOfRange: new Date('2026-06-01T00:00:00Z'),
      endOfRange: new Date('2026-06-25T00:00:00Z'),
      sessionStat: expectedResultStat,
      activityDistribution: [{ ...aMeta, sessionStat: expectedResultStat }],
    } as TimeBar);

    // if finalObjEndOfRange is start of the next month
    result = analyticsService.mergeBarsWithDailyRangeOnRight({
      leftObj,
      rightObj,
      timezone,
      finalObjEndOfRange: new Date('2026-07-01T00:00:00Z'),
    });
    expect(result.length).toBe(2);
    expect(result[1]).toEqual({
      startOfRange: new Date('2026-06-01T00:00:00Z'),
      endOfRange: new Date('2026-07-01T00:00:00Z'),
      sessionStat: expectedResultStat,
      activityDistribution: [{ ...aMeta, sessionStat: expectedResultStat }],
    } as TimeBar);

    // if finalObjEndOfRange is later than start of next month
    result = analyticsService.mergeBarsWithDailyRangeOnRight({
      leftObj,
      rightObj,
      timezone,
      finalObjEndOfRange: new Date('2026-08-01T00:00:00Z'),
    });
    expect(result.length).toBe(3);
    expect(result[1]).toEqual({
      startOfRange: new Date('2026-06-01T00:00:00Z'),
      endOfRange: new Date('2026-07-01T00:00:00Z'),
      sessionStat: expectedResultStat,
      activityDistribution: [{ ...aMeta, sessionStat: expectedResultStat }],
    } as TimeBar);
  });

  it('if final bar type is year, should return left bars and properly change last bar', () => {
    const lastLeftBarStat: SessionStat = {
      sessionsAmount: 4,
      spentTimeSeconds: 100,
      pausedAmount: 2,
    };
    const leftObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2025-01-01T00:00:00Z'),
      endOfRange: new Date('2026-06-20T00:00:00Z'),
      sessionStat: emptySessionStat,
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2025-01-01T00:00:00Z'),
          endOfRange: new Date('2026-01-01T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2026-01-01T00:00:00Z'),
          endOfRange: new Date('2026-06-20T00:00:00Z'),
          sessionStat: lastLeftBarStat,
          activityDistribution: [{ ...aMeta, sessionStat: lastLeftBarStat }],
        },
      ],
    };

    const expectedResultStat: SessionStat = {
      sessionsAmount: 7,
      spentTimeSeconds: 175,
      pausedAmount: 4,
    };

    // if finalObjEndOfRange is the same as rightObj.endOfRange
    let result = analyticsService.mergeBarsWithDailyRangeOnRight({
      leftObj,
      rightObj,
      finalObjEndOfRange: rightObj.endOfRange,
      timezone,
    });
    expect(result.length).toBe(2);
    expect(result[1]).toEqual({
      startOfRange: new Date('2026-01-01T00:00:00Z'),
      endOfRange: rightObj.endOfRange,
      sessionStat: expectedResultStat,
      activityDistribution: [{ ...aMeta, sessionStat: expectedResultStat }],
    } as TimeBar);

    // if finalObjEndOfRange is later than rightObj.endOfRange, but earlier than start of next year
    result = analyticsService.mergeBarsWithDailyRangeOnRight({
      leftObj,
      rightObj,
      finalObjEndOfRange: new Date('2026-09-01T00:00:00Z'),
      timezone,
    });
    expect(result.length).toBe(2);
    expect(result[1]).toEqual({
      startOfRange: new Date('2026-01-01T00:00:00Z'),
      endOfRange: new Date('2026-09-01T00:00:00Z'),
      sessionStat: expectedResultStat,
      activityDistribution: [{ ...aMeta, sessionStat: expectedResultStat }],
    } as TimeBar);

    // if finalObjEndOfRange is later than start of next year
    result = analyticsService.mergeBarsWithDailyRangeOnRight({
      leftObj,
      rightObj,
      finalObjEndOfRange: new Date('2028-09-01T00:00:00Z'),
      timezone,
    });
    expect(result.length).toBe(4);
    expect(result[1]).toEqual({
      startOfRange: new Date('2026-01-01T00:00:00Z'),
      endOfRange: new Date('2027-01-01T00:00:00Z'),
      sessionStat: expectedResultStat,
      activityDistribution: [{ ...aMeta, sessionStat: expectedResultStat }],
    } as TimeBar);
  });
});

describe('analyticsService.mergeAdjacentTimeBars', () => {
  it('should throw an error if neither the left nor the right range is daily', () => {
    const leftObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2025-09-01T00:00:00Z'),
      endOfRange: new Date('2025-11-01T00:00:00Z'),
      sessionStat: emptySessionStat,
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2025-09-01T00:00:00Z'),
          endOfRange: new Date('2025-10-01T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-10-01T00:00:00Z'),
          endOfRange: new Date('2025-11-01T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
      ],
    };

    const rightObj: AnalyticsForRangeDTO = {
      startOfRange: new Date('2025-11-01T00:00:00Z'),
      endOfRange: new Date('2026-01-01T00:00:00Z'),
      sessionStat: emptySessionStat,
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2025-11-01T00:00:00Z'),
          endOfRange: new Date('2025-12-01T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-12-01T00:00:00Z'),
          endOfRange: new Date('2026-01-01T00:00:00Z'),
          sessionStat: emptySessionStat,
          activityDistribution: [],
        },
      ],
    };

    try {
      analyticsService.mergeAdjacentTimeBars({
        leftObj,
        rightObj,
        finalObjEndOfRange: new Date('2026-01-01T00:00:00Z'),
        timezone: 'UTC',
        dailyRangePosition: 'left',
      });
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });
});

describe('analyticsService.buildUpdatedCacheValues', () => {
  it('should update activity name and color in activityDistribution (only in analytics containing the activity)', () => {
    const Aid = new Types.ObjectId();

    const firstAnalytics: AnalyticsForRangeDTO = {
      startOfRange: new Date(),
      endOfRange: new Date(),
      sessionStat: emptySessionStat,
      activityDistribution: [
        {
          id: Aid.toString(),
          name: 'A',
          color: 'Acolor',
          sessionStat: {
            sessionsAmount: 2,
            pausedAmount: 2,
            spentTimeSeconds: 120,
          },
        },
        {
          id: 'Bid',
          name: 'B',
          color: 'Bcolor',
          sessionStat: {
            sessionsAmount: 1,
            pausedAmount: 0,
            spentTimeSeconds: 60,
          },
        },
      ],
      timeBars: [],
    };
    const secondAnalytics: AnalyticsForRangeDTO = {
      startOfRange: new Date(),
      endOfRange: new Date(),
      sessionStat: {
        sessionsAmount: 3,
        pausedAmount: 1,
        spentTimeSeconds: 180,
      },
      activityDistribution: [
        {
          id: Aid.toString(),
          name: 'A',
          color: 'Acolor',
          sessionStat: {
            sessionsAmount: 5,
            pausedAmount: 4,
            spentTimeSeconds: 1000,
          },
        },
        {
          id: 'Cid',
          name: 'C',
          color: 'Ccolor',
          sessionStat: {
            sessionsAmount: 1,
            pausedAmount: 1,
            spentTimeSeconds: 30,
          },
        },
      ],
      timeBars: [],
    };
    const thirdAnalytics: AnalyticsForRangeDTO = {
      startOfRange: new Date(),
      endOfRange: new Date(),
      sessionStat: emptySessionStat,
      activityDistribution: [
        {
          id: 'Bid',
          name: 'B',
          color: 'Bcolor',
          sessionStat: {
            sessionsAmount: 1,
            pausedAmount: 0,
            spentTimeSeconds: 60,
          },
        },
        {
          id: 'Cid',
          name: 'C',
          color: 'Ccolor',
          sessionStat: {
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
      startOfRange: new Date(),
      endOfRange: new Date(),
      sessionStat: emptySessionStat,
      activityDistribution: [
        {
          id: Aid.toString(),
          name: 'A',
          color: 'Acolor',
          sessionStat: {
            sessionsAmount: 2,
            pausedAmount: 2,
            spentTimeSeconds: 120,
          },
        },
        {
          id: 'Bid',
          name: 'B',
          color: 'Bcolor',
          sessionStat: {
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
          sessionStat: {
            sessionsAmount: 3,
            pausedAmount: 2,
            spentTimeSeconds: 180,
          },
          activityDistribution: [
            {
              id: Aid.toString(),
              name: 'A',
              color: 'Acolor',
              sessionStat: {
                sessionsAmount: 2,
                pausedAmount: 2,
                spentTimeSeconds: 120,
              },
            },
            {
              id: 'Bid',
              name: 'B',
              color: 'Bcolor',
              sessionStat: {
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
      startOfRange: new Date(),
      endOfRange: new Date(),
      sessionStat: {
        sessionsAmount: 3,
        pausedAmount: 1,
        spentTimeSeconds: 180,
      },
      activityDistribution: [
        {
          id: Aid.toString(),
          name: 'A',
          color: 'Acolor',
          sessionStat: {
            sessionsAmount: 5,
            pausedAmount: 4,
            spentTimeSeconds: 1000,
          },
        },
        {
          id: 'Cid',
          name: 'C',
          color: 'Ccolor',
          sessionStat: {
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
          sessionStat: {
            sessionsAmount: 5,
            pausedAmount: 4,
            spentTimeSeconds: 1000,
          },
          activityDistribution: [
            {
              id: Aid.toString(),
              name: 'A',
              color: 'Acolor',
              sessionStat: {
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
          sessionStat: {
            sessionsAmount: 1,
            pausedAmount: 1,
            spentTimeSeconds: 30,
          },
          activityDistribution: [
            {
              id: 'Cid',
              name: 'C',
              color: 'Ccolor',
              sessionStat: {
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

  it('should delete activity from activityDistribution and timeBars and reduce sessionStat overall and in timeBars (only in analytics containing the activity)', () => {
    const Aid = new Types.ObjectId();
    const mockedDate = new Date();

    const firstAnalytics: AnalyticsForRangeDTO = {
      startOfRange: mockedDate,
      endOfRange: mockedDate,
      sessionStat: {
        sessionsAmount: 5,
        pausedAmount: 4,
        spentTimeSeconds: 240,
      },
      activityDistribution: [
        {
          id: Aid.toString(),
          name: 'A',
          color: 'Acolor',
          sessionStat: {
            sessionsAmount: 3,
            pausedAmount: 1,
            spentTimeSeconds: 180,
          },
        },
        {
          id: 'Bid',
          name: 'B',
          color: 'Bcolor',
          sessionStat: {
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
          sessionStat: {
            sessionsAmount: 4,
            pausedAmount: 1,
            spentTimeSeconds: 150,
          },
          activityDistribution: [
            {
              id: Aid.toString(),
              name: 'A',
              color: 'Acolor',
              sessionStat: {
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
      startOfRange: mockedDate,
      endOfRange: mockedDate,
      sessionStat: {
        sessionsAmount: 5,
        pausedAmount: 4,
        spentTimeSeconds: 240,
      },
      activityDistribution: [
        {
          id: 'Bid',
          name: 'B',
          color: 'Bcolor',
          sessionStat: {
            sessionsAmount: 2,
            pausedAmount: 3,
            spentTimeSeconds: 60,
          },
        },
        {
          id: 'Cid',
          name: 'C',
          color: 'Ccolor',
          sessionStat: {
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
        startOfRange: mockedDate,
        endOfRange: mockedDate,
        sessionStat: {
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
            sessionStat: {
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
