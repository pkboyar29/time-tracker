import analyticsService from '../../../service/analytics.service';
import activityService from '../../../service/activity.service';
import { IActivity } from '../../../model/activity.model';
import mongoose from 'mongoose';
import { ISessionPart } from '../../../model/sessionPart.model';
import { ISession } from '../../../model/session.model';
import {
  ActivityDistribution,
  AnalyticsForRangeDTO,
  TimeBar,
} from '../../../dto/analytics.dto';
import * as dateUtils from '../../../helpers/getTodayRange';

describe('analyticsService.getSessionStatistics', () => {
  it('should sum correctly', () => {
    const sessionParts: ISessionPart[] = [
      {
        _id: new mongoose.Types.ObjectId(),
        spentTimeSeconds: 120,
        session: { activity: { name: 'Reading' } },
        user: new mongoose.Types.ObjectId(),
        createdDate: new Date('2025-09-20T10:00:00Z'),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        spentTimeSeconds: 90,
        session: { activity: { name: 'Coding' } },
        user: new mongoose.Types.ObjectId(),
        createdDate: new Date('2025-09-20T12:00:00Z'),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        spentTimeSeconds: 60,
        session: { activity: { name: 'Exercise' } },
        user: new mongoose.Types.ObjectId(),
        createdDate: new Date('2025-09-20T14:00:00Z'),
      },
    ];

    const completedSessions: ISession[] = [
      {
        _id: new mongoose.Types.ObjectId(),
        totalTimeSeconds: 300,
        spentTimeSeconds: 300,
        note: 'Morning session',
        completed: true,
        activity: { name: 'Reading' },
        user: new mongoose.Types.ObjectId(),
        createdDate: new Date('2025-09-20T08:00:00Z'),
        updatedDate: new Date('2025-09-20T08:30:00Z'),
        deleted: false,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        totalTimeSeconds: 180,
        spentTimeSeconds: 180,
        note: 'Afternoon session',
        completed: true,
        activity: { name: 'Coding' },
        user: new mongoose.Types.ObjectId(),
        createdDate: new Date('2025-09-20T14:00:00Z'),
        updatedDate: new Date('2025-09-20T14:30:00Z'),
        deleted: false,
      },
    ];

    const { spentTimeSeconds, sessionsAmount } =
      analyticsService.getSessionsStatistics({
        sessionParts,
        completedSessions,
      });
    expect(spentTimeSeconds).toBe(270);
    expect(sessionsAmount).toBe(2);
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
  const mockActivities: IActivity[] = [
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Reading',
      user: new mongoose.Types.ObjectId(),
      activityGroup: new mongoose.Types.ObjectId(),
      createdDate: new Date(),
      updatedDate: new Date(),
      deleted: false,
      archived: false,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Coding',
      user: new mongoose.Types.ObjectId(),
      activityGroup: new mongoose.Types.ObjectId(),
      createdDate: new Date(),
      updatedDate: new Date(),
      deleted: false,
      archived: false,
    },
  ];

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
      activity: { name: 'Coding' },
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
      userActivities: mockActivities,
    });

    expect(result).toHaveLength(2);

    expect(result[0].startOfRange).toEqual(new Date('2025-07-01T00:00:00Z'));
    expect(result[0].endOfRange).toEqual(new Date('2025-07-02T00:00:00Z'));
    expect(result[0].spentTimeSeconds).toBe(1800);
    expect(result[0].sessionsAmount).toBe(1);

    expect(result[1].startOfRange).toEqual(new Date('2025-07-02T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-07-03T00:00:00Z'));
    expect(result[1].spentTimeSeconds).toBe(900);
    expect(result[1].sessionsAmount).toBe(2);
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
    expect(result[0].spentTimeSeconds).toBe(1800);
    expect(result[0].sessionsAmount).toBe(1);

    expect(result[1].startOfRange).toEqual(new Date('2025-07-02T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-07-02T18:00:00Z'));
    expect(result[1].spentTimeSeconds).toBe(900);
    expect(result[1].sessionsAmount).toBe(2);
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
    expect(result[0].spentTimeSeconds).toBe(600);
    expect(result[0].sessionsAmount).toBe(1);

    expect(result[1].startOfRange).toEqual(new Date('2025-07-02T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-07-03T00:00:00Z'));
    expect(result[1].spentTimeSeconds).toBe(900);
    expect(result[1].sessionsAmount).toBe(2);
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
    expect(result[0].spentTimeSeconds).toBe(2700);
    expect(result[0].sessionsAmount).toBe(3);

    expect(result[1].startOfRange).toEqual(new Date('2025-08-01T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-09-01T00:00:00Z'));
    expect(result[1].spentTimeSeconds).toBe(0);
    expect(result[1].sessionsAmount).toBe(0);
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
    expect(result[0].spentTimeSeconds).toBe(2700);
    expect(result[0].sessionsAmount).toBe(3);

    expect(result[1].startOfRange).toEqual(new Date('2025-08-01T00:00:00Z'));
    expect(result[1].endOfRange).toEqual(new Date('2025-08-10T00:00:00Z'));
    expect(result[1].spentTimeSeconds).toBe(0);
    expect(result[1].sessionsAmount).toBe(0);
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
      spentTimeSeconds: 0,
      sessionsAmount: 0,
      activityDistribution: [],
    });

    expect(result[1]).toEqual({
      startOfRange: new Date('2025-06-01T00:00:00Z'),
      endOfRange: new Date('2025-07-01T00:00:00Z'),
      spentTimeSeconds: 0,
      sessionsAmount: 0,
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
      spentTimeSeconds: 0,
      sessionsAmount: 0,
      activityDistribution: [],
    });
    expect(result[1]).toEqual({
      startOfRange: new Date('2024-07-31T21:00:00.000Z'),
      endOfRange: new Date('2024-08-31T21:00:00.000Z'),
      spentTimeSeconds: 0,
      sessionsAmount: 0,
      activityDistribution: [],
    });
    expect(result[2]).toEqual({
      startOfRange: new Date('2024-08-31T21:00:00.000Z'),
      endOfRange: new Date('2024-09-30T21:00:00.000Z'),
      spentTimeSeconds: 0,
      sessionsAmount: 0,
      activityDistribution: [],
    });
    expect(result[3]).toEqual({
      startOfRange: new Date('2024-09-30T21:00:00.000Z'),
      endOfRange: new Date('2024-10-31T21:00:00.000Z'),
      spentTimeSeconds: 0,
      sessionsAmount: 0,
      activityDistribution: [],
    });
    expect(result[4]).toEqual({
      startOfRange: new Date('2024-10-31T21:00:00.000Z'),
      endOfRange: new Date('2024-11-30T21:00:00.000Z'),
      spentTimeSeconds: 0,
      sessionsAmount: 0,
      activityDistribution: [],
    });
    expect(result[5]).toEqual({
      startOfRange: new Date('2024-11-30T21:00:00.000Z'),
      endOfRange: new Date('2024-12-31T21:00:00.000Z'),
      spentTimeSeconds: 0,
      sessionsAmount: 0,
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
        activityName: 'Reading',
        sessionsAmount: 1,
        spentTimeSeconds: 1800,
      },
    ]);
    expect(result[1].activityDistribution).toEqual([
      {
        activityName: 'Reading',
        sessionsAmount: 1,
        spentTimeSeconds: 900,
      },
      {
        activityName: 'Coding',
        sessionsAmount: 1,
        spentTimeSeconds: 0,
      },
    ]);
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
      archived: false,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'Coding',
      user: new mongoose.Types.ObjectId(),
      activityGroup: new mongoose.Types.ObjectId(),
      createdDate: new Date(),
      updatedDate: new Date(),
      deleted: false,
      archived: false,
    },
  ];

  it('should return correct distribution when sessions and sessionParts match activities', async () => {
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

    const result = analyticsService.getActivityDistributions({
      allSessionsAmount: 4,
      allSpentTimeSeconds: 400,
      sessionParts,
      completedSessions,
      userActivities: mockActivities,
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

    const result = analyticsService.getActivityDistributions({
      allSessionsAmount: 1,
      allSpentTimeSeconds: 300,
      sessionParts,
      completedSessions,
      userActivities: mockActivities,
    });

    expect(result).toHaveLength(1); // only one activity - reading, even if there are many activities returned in getActivities

    expect(result).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ activityName: 'Without activity' }),
      ])
    );
  });
});

describe('analyticsService.mergeActivityDistributions', () => {
  const firstAd: ActivityDistribution[] = [
    { activityName: 'A', sessionsAmount: 1, spentTimeSeconds: 100 },
    { activityName: 'B', sessionsAmount: 1, spentTimeSeconds: 200 },
  ];
  const secondAd: ActivityDistribution[] = [
    { activityName: 'A', sessionsAmount: 1, spentTimeSeconds: 50 },
    { activityName: 'C', sessionsAmount: 1, spentTimeSeconds: 100 },
  ];
  const thirdAd: ActivityDistribution[] = [
    { activityName: 'A', sessionsAmount: 1, spentTimeSeconds: 50 },
    { activityName: 'B', sessionsAmount: 2, spentTimeSeconds: 200 },
    { activityName: 'D', sessionsAmount: 1, spentTimeSeconds: 100 },
  ];
  const fourthAd: ActivityDistribution[] = [
    { activityName: 'B', sessionsAmount: 2, spentTimeSeconds: 100 },
    { activityName: 'D', sessionsAmount: 0, spentTimeSeconds: 300 },
    { activityName: 'E', sessionsAmount: 2, spentTimeSeconds: 200 },
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

    const activityA = result.find((a) => a.activityName === 'A');
    expect(activityA).toEqual({
      activityName: 'A',
      sessionsAmount: 2,
      spentTimeSeconds: 150,
    });

    const activityB = result.find((a) => a.activityName === 'B');
    expect(activityB).toEqual({
      activityName: 'B',
      sessionsAmount: 1,
      spentTimeSeconds: 200,
    });

    const activityC = result.find((a) => a.activityName === 'C');
    expect(activityC).toEqual({
      activityName: 'C',
      sessionsAmount: 1,
      spentTimeSeconds: 100,
    });
  });

  it('should merge four activityDistributions correctly', () => {
    const result = analyticsService.mergeActivityDistributions({
      adsList: [firstAd, secondAd, thirdAd, fourthAd],
    });

    expect(result).toHaveLength(5);
    const activityA = result.find((a) => a.activityName === 'A');
    expect(activityA).toEqual({
      activityName: 'A',
      sessionsAmount: 3,
      spentTimeSeconds: 200,
    });

    const activityB = result.find((a) => a.activityName === 'B');
    expect(activityB).toEqual({
      activityName: 'B',
      sessionsAmount: 5,
      spentTimeSeconds: 500,
    });

    const activityC = result.find((a) => a.activityName === 'C');
    expect(activityC).toEqual({
      activityName: 'C',
      sessionsAmount: 1,
      spentTimeSeconds: 100,
    });

    const activityD = result.find((a) => a.activityName === 'D');
    expect(activityD).toEqual({
      activityName: 'D',
      sessionsAmount: 1,
      spentTimeSeconds: 400,
    });

    const activityE = result.find((a) => a.activityName === 'E');
    expect(activityE).toEqual({
      activityName: 'E',
      sessionsAmount: 2,
      spentTimeSeconds: 200,
    });
  });
});

describe('analyticsService.mergeAnalytics', () => {
  const timezone = 'UTC';
  const startOfToday = new Date('2025-09-20T00:00:00Z');
  const startOfTomorrow = new Date('2025-09-21T00:00:00Z');

  const untilTodayObj: AnalyticsForRangeDTO = {
    sessionsAmount: 2,
    spentTimeSeconds: 300,
    activityDistribution: [
      { activityName: 'A', sessionsAmount: 1, spentTimeSeconds: 100 },
      { activityName: 'B', sessionsAmount: 1, spentTimeSeconds: 200 },
    ],
    timeBars: [
      {
        startOfRange: new Date('2025-09-18T00:00:00Z'),
        endOfRange: new Date('2025-09-19T00:00:00Z'),
        sessionsAmount: 1,
        spentTimeSeconds: 25,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-09-19T00:00:00Z'),
        endOfRange: new Date('2025-09-20T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 25,
        activityDistribution: [],
      },
    ],
  };

  const todayObj: AnalyticsForRangeDTO = {
    sessionsAmount: 1,
    spentTimeSeconds: 150,
    activityDistribution: [
      { activityName: 'A', sessionsAmount: 1, spentTimeSeconds: 50 },
      { activityName: 'C', sessionsAmount: 0, spentTimeSeconds: 100 },
    ],
    timeBars: [],
  };

  it('should sum sessionsAmount and spentTimeSeconds correctly', () => {
    const result = analyticsService.mergeAnalytics({
      finalObjStartOfRange: new Date('2025-09-18T00:00:00Z'),
      finalObjEndOfRange: new Date('2025-09-22T00:00:00Z'),
      untilTodayObj,
      todayObj,
      timezone,
    });

    expect(result.sessionsAmount).toBe(3);
    expect(result.spentTimeSeconds).toBe(450);
  });

  it('should create correct day timeBars', () => {
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
      sessionsAmount: 1,
      spentTimeSeconds: 25,
      activityDistribution: [],
    });
    expect(timeBars[1]).toEqual({
      startOfRange: new Date('2025-09-19T00:00:00Z'),
      endOfRange: new Date('2025-09-20T00:00:00Z'),
      sessionsAmount: 0,
      spentTimeSeconds: 25,
      activityDistribution: [],
    });
    expect(timeBars[2]).toEqual({
      startOfRange: startOfToday,
      endOfRange: startOfTomorrow,
      sessionsAmount: 1,
      spentTimeSeconds: 150,
      activityDistribution: [
        {
          activityName: 'A',
          sessionsAmount: 1,
          spentTimeSeconds: 50,
        },
        {
          activityName: 'C',
          sessionsAmount: 0,
          spentTimeSeconds: 100,
        },
      ],
    });
    expect(timeBars[3]).toEqual({
      startOfRange: new Date('2025-09-21T00:00:00Z'),
      endOfRange: new Date('2025-09-22T00:00:00Z'),
      sessionsAmount: 0,
      spentTimeSeconds: 0,
      activityDistribution: [],
    });
    expect(timeBars[4]).toEqual({
      startOfRange: new Date('2025-09-22T00:00:00Z'),
      endOfRange: new Date('2025-09-23T00:00:00Z'),
      sessionsAmount: 0,
      spentTimeSeconds: 0,
      activityDistribution: [],
    });
    expect(timeBars[5]).toEqual({
      startOfRange: new Date('2025-09-23T00:00:00Z'),
      endOfRange: new Date('2025-09-24T00:00:00Z'),
      sessionsAmount: 0,
      spentTimeSeconds: 0,
      activityDistribution: [],
    });
  });

  it('should create correct month timeBars', () => {
    jest.spyOn(dateUtils, 'getTodayRange').mockReturnValue({
      startOfToday,
      startOfTomorrow,
    });

    const untilTodayObj: AnalyticsForRangeDTO = {
      sessionsAmount: 2,
      spentTimeSeconds: 300,
      activityDistribution: [
        { activityName: 'A', sessionsAmount: 1, spentTimeSeconds: 100 },
        { activityName: 'B', sessionsAmount: 1, spentTimeSeconds: 200 },
      ],
      timeBars: [
        {
          startOfRange: new Date('2025-01-01T00:00:00Z'),
          endOfRange: new Date('2025-02-01T00:00:00Z'),
          sessionsAmount: 10,
          spentTimeSeconds: 25,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-02-01T00:00:00Z'),
          endOfRange: new Date('2025-03-01T00:00:00Z'),
          sessionsAmount: 0,
          spentTimeSeconds: 25,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-03-01T00:00:00Z'),
          endOfRange: new Date('2025-04-01T00:00:00Z'),
          sessionsAmount: 0,
          spentTimeSeconds: 25,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-04-01T00:00:00Z'),
          endOfRange: new Date('2025-05-01T00:00:00Z'),
          sessionsAmount: 0,
          spentTimeSeconds: 25,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-05-01T00:00:00Z'),
          endOfRange: new Date('2025-06-01T00:00:00Z'),
          sessionsAmount: 0,
          spentTimeSeconds: 25,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-06-01T00:00:00Z'),
          endOfRange: new Date('2025-07-01T00:00:00Z'),
          sessionsAmount: 0,
          spentTimeSeconds: 25,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-07-01T00:00:00Z'),
          endOfRange: new Date('2025-08-01T00:00:00Z'),
          sessionsAmount: 0,
          spentTimeSeconds: 25,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-08-01T00:00:00Z'),
          endOfRange: new Date('2025-09-01T00:00:00Z'),
          sessionsAmount: 0,
          spentTimeSeconds: 25,
          activityDistribution: [],
        },
        {
          startOfRange: new Date('2025-09-01T00:00:00Z'),
          endOfRange: new Date('2025-09-20T00:00:00Z'),
          sessionsAmount: 0,
          spentTimeSeconds: 25,
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
        sessionsAmount: 10,
        spentTimeSeconds: 25,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-02-01T00:00:00Z'),
        endOfRange: new Date('2025-03-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 25,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-03-01T00:00:00Z'),
        endOfRange: new Date('2025-04-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 25,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-04-01T00:00:00Z'),
        endOfRange: new Date('2025-05-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 25,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-05-01T00:00:00Z'),
        endOfRange: new Date('2025-06-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 25,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-06-01T00:00:00Z'),
        endOfRange: new Date('2025-07-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 25,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-07-01T00:00:00Z'),
        endOfRange: new Date('2025-08-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 25,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-08-01T00:00:00Z'),
        endOfRange: new Date('2025-09-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 25,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-09-01T00:00:00Z'),
        endOfRange: new Date('2025-10-01T00:00:00Z'),
        sessionsAmount: 1,
        spentTimeSeconds: 175,
        activityDistribution: [
          {
            activityName: 'A',
            sessionsAmount: 1,
            spentTimeSeconds: 50,
          },
          {
            activityName: 'C',
            sessionsAmount: 0,
            spentTimeSeconds: 100,
          },
        ],
      },
      {
        startOfRange: new Date('2025-10-01T00:00:00Z'),
        endOfRange: new Date('2025-11-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-11-01T00:00:00Z'),
        endOfRange: new Date('2025-12-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-12-01T00:00:00Z'),
        endOfRange: new Date('2026-01-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 0,
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
      sessionsAmount: 0,
      spentTimeSeconds: 0,
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
        sessionsAmount: 1,
        spentTimeSeconds: 150,
        activityDistribution: [
          {
            activityName: 'A',
            sessionsAmount: 1,
            spentTimeSeconds: 50,
          },
          {
            activityName: 'C',
            sessionsAmount: 0,
            spentTimeSeconds: 100,
          },
        ],
      },
      {
        startOfRange: new Date('2025-09-21T00:00:00Z'),
        endOfRange: new Date('2025-09-22T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-09-22T00:00:00Z'),
        endOfRange: new Date('2025-09-23T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        activityDistribution: [],
      },
    ]);
  });

  it('should create correct day timebars when starting from yesterday', () => {
    jest.spyOn(dateUtils, 'getTodayRange').mockReturnValue({
      startOfToday,
      startOfTomorrow,
    });

    const untilTodayObj: AnalyticsForRangeDTO = {
      sessionsAmount: 1,
      spentTimeSeconds: 200,
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
        sessionsAmount: 1,
        spentTimeSeconds: 200,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-09-20T00:00:00Z'),
        endOfRange: new Date('2025-09-21T00:00:00Z'),
        sessionsAmount: 1,
        spentTimeSeconds: 150,
        activityDistribution: [
          {
            activityName: 'A',
            sessionsAmount: 1,
            spentTimeSeconds: 50,
          },
          {
            activityName: 'C',
            sessionsAmount: 0,
            spentTimeSeconds: 100,
          },
        ],
      },
      {
        startOfRange: new Date('2025-09-21T00:00:00Z'),
        endOfRange: new Date('2025-09-22T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-09-22T00:00:00Z'),
        endOfRange: new Date('2025-09-23T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 0,
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
      sessionsAmount: 3,
      spentTimeSeconds: 600,
      activityDistribution: [],
      timeBars: [
        {
          startOfRange: new Date('2025-09-17T00:00:00Z'),
          endOfRange: new Date('2025-09-18T00:00:00Z'),
          sessionsAmount: 1,
          spentTimeSeconds: 200,
          activityDistribution: [
            {
              activityName: 'A',
              sessionsAmount: 1,
              spentTimeSeconds: 200,
            },
          ],
        },
        {
          startOfRange: new Date('2025-09-18T00:00:00Z'),
          endOfRange: new Date('2025-09-19T00:00:00Z'),
          sessionsAmount: 1,
          spentTimeSeconds: 200,
          activityDistribution: [
            {
              activityName: 'A',
              sessionsAmount: 1,
              spentTimeSeconds: 200,
            },
          ],
        },
        {
          startOfRange: new Date('2025-09-19T00:00:00Z'),
          endOfRange: new Date('2025-09-20T00:00:00Z'),
          sessionsAmount: 1,
          spentTimeSeconds: 200,
          activityDistribution: [
            {
              activityName: 'A',
              sessionsAmount: 1,
              spentTimeSeconds: 200,
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
        sessionsAmount: 4,
        spentTimeSeconds: 750,
        activityDistribution: [
          {
            activityName: 'A',
            sessionsAmount: 4,
            spentTimeSeconds: 650,
          },
          {
            activityName: 'C',
            sessionsAmount: 0,
            spentTimeSeconds: 100,
          },
        ],
      },
      {
        startOfRange: new Date('2025-10-01T00:00:00Z'),
        endOfRange: new Date('2025-11-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-11-01T00:00:00Z'),
        endOfRange: new Date('2025-12-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-12-01T00:00:00Z'),
        endOfRange: new Date('2026-01-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 0,
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
      sessionsAmount: 1,
      spentTimeSeconds: 100,
      activityDistribution: [],
      timeBars: [],
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
        sessionsAmount: 2,
        spentTimeSeconds: 250,
        activityDistribution: [
          { activityName: 'A', sessionsAmount: 1, spentTimeSeconds: 50 },
          { activityName: 'C', sessionsAmount: 0, spentTimeSeconds: 100 },
        ],
      },
      {
        startOfRange: new Date('2025-10-01T00:00:00Z'),
        endOfRange: new Date('2025-11-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-11-01T00:00:00Z'),
        endOfRange: new Date('2025-12-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-12-01T00:00:00Z'),
        endOfRange: new Date('2026-01-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 0,
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
      sessionsAmount: 0,
      spentTimeSeconds: 0,
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
        sessionsAmount: 1,
        spentTimeSeconds: 150,
        activityDistribution: [
          { activityName: 'A', sessionsAmount: 1, spentTimeSeconds: 50 },
          { activityName: 'C', sessionsAmount: 0, spentTimeSeconds: 100 },
        ],
      },
      {
        startOfRange: new Date('2025-10-01T00:00:00Z'),
        endOfRange: new Date('2025-11-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-11-01T00:00:00Z'),
        endOfRange: new Date('2025-12-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 0,
        activityDistribution: [],
      },
      {
        startOfRange: new Date('2025-12-01T00:00:00Z'),
        endOfRange: new Date('2026-01-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 0,
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
      sessionsAmount: 5,
      spentTimeSeconds: 500,
      activityDistribution: [
        { activityName: 'A', sessionsAmount: 3, spentTimeSeconds: 300 },
        { activityName: 'C', sessionsAmount: 2, spentTimeSeconds: 200 },
      ],
      timeBars: [
        {
          startOfRange: new Date('2025-09-28T00:00:00Z'),
          endOfRange: new Date('2025-09-29T00:00:00Z'),
          sessionsAmount: 2,
          spentTimeSeconds: 200,
          activityDistribution: [
            { activityName: 'A', sessionsAmount: 0, spentTimeSeconds: 0 },
            { activityName: 'C', sessionsAmount: 1, spentTimeSeconds: 100 },
          ],
        },
        {
          startOfRange: new Date('2025-09-29T00:00:00Z'),
          endOfRange: new Date('2025-09-30T00:00:00Z'),
          sessionsAmount: 3,
          spentTimeSeconds: 300,
          activityDistribution: [
            { activityName: 'A', sessionsAmount: 3, spentTimeSeconds: 300 },
            { activityName: 'C', sessionsAmount: 1, spentTimeSeconds: 100 },
          ],
        },
        {
          startOfRange: new Date('2025-09-30T00:00:00Z'),
          endOfRange: new Date('2025-10-01T00:00:00Z'),
          sessionsAmount: 0,
          spentTimeSeconds: 0,
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
        sessionsAmount: 5,
        spentTimeSeconds: 500,
        activityDistribution: [
          { activityName: 'A', sessionsAmount: 3, spentTimeSeconds: 300 },
          { activityName: 'C', sessionsAmount: 2, spentTimeSeconds: 200 },
        ],
      },
      {
        startOfRange: new Date('2025-10-01T00:00:00Z'),
        endOfRange: new Date('2025-11-01T00:00:00Z'),
        sessionsAmount: 1,
        spentTimeSeconds: 150,
        activityDistribution: [
          { activityName: 'A', sessionsAmount: 1, spentTimeSeconds: 50 },
          { activityName: 'C', sessionsAmount: 0, spentTimeSeconds: 100 },
        ],
      },
      {
        startOfRange: new Date('2025-11-01T00:00:00Z'),
        endOfRange: new Date('2025-12-01T00:00:00Z'),
        sessionsAmount: 0,
        spentTimeSeconds: 0,
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
      sessionsAmount: 5,
      spentTimeSeconds: 500,
      activityDistribution: [
        { activityName: 'A', sessionsAmount: 3, spentTimeSeconds: 300 },
        { activityName: 'C', sessionsAmount: 2, spentTimeSeconds: 200 },
      ],
      timeBars: [
        {
          startOfRange: new Date('2025-08-01T00:00:00Z'),
          endOfRange: new Date('2025-09-01T00:00:00Z'),
          sessionsAmount: 3,
          spentTimeSeconds: 300,
          activityDistribution: [
            { activityName: 'A', sessionsAmount: 3, spentTimeSeconds: 300 },
            { activityName: 'C', sessionsAmount: 0, spentTimeSeconds: 0 },
          ],
        },
        {
          startOfRange: new Date('2025-09-01T00:00:00Z'),
          endOfRange: new Date('2025-10-01T00:00:00Z'),
          sessionsAmount: 2,
          spentTimeSeconds: 200,
          activityDistribution: [
            { activityName: 'A', sessionsAmount: 0, spentTimeSeconds: 0 },
            { activityName: 'C', sessionsAmount: 2, spentTimeSeconds: 200 },
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
        sessionsAmount: 3,
        spentTimeSeconds: 300,
        activityDistribution: [
          { activityName: 'A', sessionsAmount: 3, spentTimeSeconds: 300 },
          { activityName: 'C', sessionsAmount: 0, spentTimeSeconds: 0 },
        ],
      },
      {
        startOfRange: new Date('2025-09-01T00:00:00Z'),
        endOfRange: new Date('2025-10-01T00:00:00Z'),
        sessionsAmount: 2,
        spentTimeSeconds: 200,
        activityDistribution: [
          { activityName: 'A', sessionsAmount: 0, spentTimeSeconds: 0 },
          { activityName: 'C', sessionsAmount: 2, spentTimeSeconds: 200 },
        ],
      },
      {
        startOfRange: new Date('2025-10-01T00:00:00Z'),
        endOfRange: new Date('2025-11-01T00:00:00Z'),
        sessionsAmount: 1,
        spentTimeSeconds: 150,
        activityDistribution: [
          { activityName: 'A', sessionsAmount: 1, spentTimeSeconds: 50 },
          { activityName: 'C', sessionsAmount: 0, spentTimeSeconds: 100 },
        ],
      },
    ]);
  });
});
