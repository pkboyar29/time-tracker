import analyticsService from '../../../service/analytics.service';
import { IDailyAggregate } from '../../../model/dailyAggregate.model';
import { Types } from 'mongoose';
import { ISessionPart } from '../../../model/sessionPart.model';
import { ISession } from '../../../model/session.model';

describe('analyticsService.getSessionsStatisticsAggregates', () => {
  it('should correctly sum all fields from multiple aggregates', () => {
    const aggregates: IDailyAggregate[] = [
      {
        _id: new Types.ObjectId(),
        user: new Types.ObjectId(),
        spentTimeSeconds: 100,
        sessionsAmount: 2,
        pausedAmount: 1,
        date: '2025-01-01',
      },
      {
        _id: new Types.ObjectId(),
        user: new Types.ObjectId(),
        spentTimeSeconds: 200,
        sessionsAmount: 3,
        pausedAmount: 2,
        date: '2025-01-02',
      },
    ];

    const result = analyticsService.getSessionsStatisticsAggregates({
      aggregates,
    });

    expect(result).toEqual({
      spentTimeSeconds: 300,
      sessionsAmount: 5,
      pausedAmount: 3,
    });
  });

  it('should return zeros when aggregates array is empty', () => {
    const result = analyticsService.getSessionsStatisticsAggregates({
      aggregates: [],
    });

    expect(result).toEqual({
      spentTimeSeconds: 0,
      sessionsAmount: 0,
      pausedAmount: 0,
    });
  });
});

describe('analyticsService.getActivityDistributionsAggregates', () => {
  it('should return aggregated distribution for a single activity', () => {
    const activityId = new Types.ObjectId();

    const result = analyticsService.getActivityDistributionsAggregates({
      totalStat: {
        spentTimeSeconds: 100,
        sessionsAmount: 2,
        pausedAmount: 1,
      },
      dailyAds: [
        {
          _id: new Types.ObjectId(),
          user: new Types.ObjectId(),
          activity: activityId,
          spentTimeSeconds: 100,
          sessionsAmount: 2,
          pausedAmount: 1,
          date: '2025-01-01',
        },
      ],
      userActivities: [
        {
          _id: activityId,
          name: 'Work',
          color: '#000',
        } as any,
      ],
    });

    expect(result).toEqual([
      {
        id: activityId.toString(),
        name: 'Work',
        color: '#000',
        sessionStatistics: {
          spentTimeSeconds: 100,
          sessionsAmount: 2,
          pausedAmount: 1,
        },
      },
    ]);
  });

  it('should sum statistics for the same activity across multiple days', () => {
    const activityId = new Types.ObjectId();

    const result = analyticsService.getActivityDistributionsAggregates({
      totalStat: {
        spentTimeSeconds: 150,
        sessionsAmount: 3,
        pausedAmount: 1,
      },
      dailyAds: [
        {
          _id: new Types.ObjectId(),
          user: new Types.ObjectId(),
          activity: activityId,
          spentTimeSeconds: 100,
          sessionsAmount: 2,
          pausedAmount: 1,
          date: '2025-01-01',
        },
        {
          _id: new Types.ObjectId(),
          user: new Types.ObjectId(),
          activity: activityId,
          spentTimeSeconds: 50,
          sessionsAmount: 1,
          pausedAmount: 0,
          date: '2025-01-02',
        },
      ],
      userActivities: [
        {
          _id: activityId,
          name: 'Study',
          color: '#111',
        } as any,
      ],
    });

    expect(result[0].sessionStatistics).toEqual({
      spentTimeSeconds: 150,
      sessionsAmount: 3,
      pausedAmount: 1,
    });
  });

  it('should handle multiple activities', () => {
    const activity1 = new Types.ObjectId();
    const activity2 = new Types.ObjectId();

    const result = analyticsService.getActivityDistributionsAggregates({
      totalStat: {
        spentTimeSeconds: 300,
        sessionsAmount: 5,
        pausedAmount: 3,
      },
      dailyAds: [
        {
          _id: new Types.ObjectId(),
          user: new Types.ObjectId(),
          activity: activity1,
          spentTimeSeconds: 100,
          sessionsAmount: 2,
          pausedAmount: 1,
          date: '2025-01-01',
        },
        {
          _id: new Types.ObjectId(),
          user: new Types.ObjectId(),
          activity: activity2,
          spentTimeSeconds: 200,
          sessionsAmount: 3,
          pausedAmount: 2,
          date: '2025-01-01',
        },
      ],
      userActivities: [
        { _id: activity1, name: 'Work', color: '#000' } as any,
        { _id: activity2, name: 'Sport', color: '#fff' } as any,
      ],
    });

    expect(result).toHaveLength(2);
  });

  it('should include "Without activity" when totals exceed activities stats', () => {
    const activityId = new Types.ObjectId();

    const result = analyticsService.getActivityDistributionsAggregates({
      totalStat: {
        spentTimeSeconds: 200,
        sessionsAmount: 4,
        pausedAmount: 2,
      },
      dailyAds: [
        {
          _id: new Types.ObjectId(),
          user: new Types.ObjectId(),
          activity: activityId,
          spentTimeSeconds: 100,
          sessionsAmount: 2,
          pausedAmount: 1,
          date: '2025-01-01',
        },
      ],
      userActivities: [{ _id: activityId, name: 'Work', color: '#000' } as any],
    });

    const withoutActivity = result.find((r) => r.id === '0');

    expect(withoutActivity).toBeDefined();
    expect(withoutActivity?.sessionStatistics).toEqual({
      spentTimeSeconds: 100,
      sessionsAmount: 2,
      pausedAmount: 1,
    });
  });

  it('should return empty array when no data provided', () => {
    const result = analyticsService.getActivityDistributionsAggregates({
      totalStat: {
        spentTimeSeconds: 0,
        sessionsAmount: 0,
        pausedAmount: 0,
      },
      dailyAds: [],
      userActivities: [],
    });

    expect(result).toEqual([]);
  });
});

describe('analyticsService.getBarStatAndAds', () => {
  it('filters raw sessionParts and sessions correctly by date range', () => {
    const start = new Date('2024-01-01T00:00:00.000Z');
    const end = new Date('2024-01-02T00:00:00.000Z');

    const sessionParts = [
      { createdDate: new Date('2023-12-31T23:59:59.000Z') }, // ❌
      { createdDate: new Date('2024-01-01T10:00:00.000Z') }, // ✅
    ];
    const sessions = [
      { updatedDate: new Date('2024-01-01T12:00:00.000Z') }, // ✅
      { updatedDate: new Date('2024-01-02T00:00:00.000Z') }, // ❌ (lt end)
    ];

    const getSessionsStatisticsSpy = jest
      .spyOn(analyticsService, 'getSessionsStatistics')
      .mockReturnValue({} as any);

    const getActivityDistributionsSpy = jest
      .spyOn(analyticsService, 'getActivityDistributions')
      .mockReturnValue([]);

    analyticsService.getBarStatAndAds({
      startOfPeriod: start,
      endOfPeriod: end,
      dataSource: {
        type: 'raw',
        sessionParts: sessionParts as any[],
        completedSessions: sessions as any[],
      },
      userActivities: [],
    });

    expect(getSessionsStatisticsSpy).toHaveBeenCalledWith({
      sessionParts: [sessionParts[1]],
      completedSessions: [sessions[0]],
    });

    expect(getActivityDistributionsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionParts: [sessionParts[1]],
        completedSessions: [sessions[0]],
      }),
    );
  });

  it('filters aggregates and dailyAds correctly by ISO date range', () => {
    const start = new Date('2024-01-01T00:00:00.000Z');
    const end = new Date('2024-01-03T00:00:00.000Z');

    const dailyAggregates = [
      { date: '2023-12-31' },
      { date: '2024-01-01' },
      { date: '2024-01-02' },
      { date: '2024-01-03' },
    ];

    const dailyAds = [...dailyAggregates];

    const getStatsSpy = jest
      .spyOn(analyticsService, 'getSessionsStatisticsAggregates')
      .mockReturnValue({} as any);

    const getAdsSpy = jest
      .spyOn(analyticsService, 'getActivityDistributionsAggregates')
      .mockReturnValue([]);

    analyticsService.getBarStatAndAds({
      startOfPeriod: start,
      endOfPeriod: end,
      dataSource: {
        type: 'aggregates',
        timezone: 'UTC',
        dailyAggregates: dailyAggregates as any[],
        dailyAds: dailyAds as any[],
      },
      userActivities: [],
    });

    expect(getStatsSpy).toHaveBeenCalledWith({
      aggregates: [dailyAggregates[1], dailyAggregates[2]],
    });

    expect(getAdsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        dailyAds: [dailyAds[1], dailyAds[2]],
      }),
    );
  });
});
