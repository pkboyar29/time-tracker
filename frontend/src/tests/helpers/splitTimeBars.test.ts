import {
  splitTimeBars,
  mergeSessionStatistics,
  mergeActivityDistributions,
} from '../../helpers/splitTimeBars';

import { TFunction } from 'i18next';
import { ISessionStatistics } from '../../ts/interfaces/Statistics/ISessionStatistics';
import { IActivityDistribution } from '../../ts/interfaces/Statistics/IActivityDistribution';
import { ITimeBar } from '../../ts/interfaces/Statistics/ITimeBar';

describe('mergeSessionStatistics', () => {
  it('correctly sums statistics from multiple entries', () => {
    const input: ISessionStatistics[] = [
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

    const result = mergeSessionStatistics(input);

    expect(result).toEqual({
      sessionsAmount: 5,
      spentTimeSeconds: 420,
      pausedAmount: 3,
    });
  });

  it('returns zeros when an empty array is provided', () => {
    const result = mergeSessionStatistics([]);

    expect(result).toEqual({
      sessionsAmount: 0,
      spentTimeSeconds: 0,
      pausedAmount: 0,
    });
  });

  it('correctly handles a single entry', () => {
    const input: ISessionStatistics[] = [
      {
        sessionsAmount: 1,
        spentTimeSeconds: 60,
        pausedAmount: 0,
      },
    ];

    const result = mergeSessionStatistics(input);

    expect(result).toEqual({
      sessionsAmount: 1,
      spentTimeSeconds: 60,
      pausedAmount: 0,
    });
  });

  it('correctly sums zero values', () => {
    const input: ISessionStatistics[] = [
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

    const result = mergeSessionStatistics(input);

    expect(result).toEqual({
      sessionsAmount: 0,
      spentTimeSeconds: 0,
      pausedAmount: 0,
    });
  });
});

describe('mergeActivityDistributions', () => {
  const codingMeta = {
    id: 'codingId',
    name: 'Coding',
    fill: '#fff',
  };
  const readingMeta = {
    id: 'readingId',
    name: 'Reading',
    fill: '#222',
  };

  it('returns empty array when adsList is empty', () => {
    const result = mergeActivityDistributions([]);
    expect(result).toEqual([]);
  });

  it('returns the same array when adsList contains a single element', () => {
    const ad: IActivityDistribution[] = [
      {
        ...codingMeta,
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 600,
          pausedAmount: 0,
        },
        spentTimePercentage: 0.6,
      },
    ];

    const result = mergeActivityDistributions([ad]);

    expect(result).toBe(ad);
  });

  it('merges distributions with the same activityName', () => {
    const adsList: IActivityDistribution[][] = [
      [
        {
          ...codingMeta,
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 300,
            pausedAmount: 0,
          },
          spentTimePercentage: 0.5,
        },
        {
          ...readingMeta,
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 300,
            pausedAmount: 0,
          },
          spentTimePercentage: 0.5,
        },
      ],
      [
        {
          ...codingMeta,
          sessionStatistics: {
            sessionsAmount: 2,
            spentTimeSeconds: 600,
            pausedAmount: 1,
          },
          spentTimePercentage: 1,
        },
      ],
    ];

    const result = mergeActivityDistributions(adsList);

    expect(result).toEqual([
      {
        ...codingMeta,
        sessionStatistics: {
          sessionsAmount: 3,
          spentTimeSeconds: 900,
          pausedAmount: 1,
        },
        spentTimePercentage: 0.75,
      },
      {
        ...readingMeta,
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 300,
          pausedAmount: 0,
        },
        spentTimePercentage: 0.25,
      },
    ]);
  });

  it('keeps activities that do not match by activityName', () => {
    const adsList: IActivityDistribution[][] = [
      [
        {
          ...codingMeta,
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 300,
            pausedAmount: 0,
          },
          spentTimePercentage: 1,
        },
      ],
      [
        {
          ...readingMeta,
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 200,
            pausedAmount: 0,
          },
          spentTimePercentage: 1,
        },
      ],
    ];

    const result = mergeActivityDistributions(adsList);

    expect(result).toEqual([
      {
        ...codingMeta,
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 300,
          pausedAmount: 0,
        },
        spentTimePercentage: 0.6,
      },
      {
        ...readingMeta,
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 200,
          pausedAmount: 0,
        },
        spentTimePercentage: 0.4,
      },
    ]);
  });
});

describe('splitTimeBars', () => {
  const tEnMock = (key: string, opts: any) => {
    const dict: Record<string, object> = {
      'months.short': [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
      'months.long': [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
    };

    return dict[key];
  };

  const timeBars: ITimeBar[] = [
    {
      startOfRange: new Date('2025-01-01T00:00:00.000Z'),
      endOfRange: new Date('2025-02-01T00:00:00.000Z'),
      barName: 'Jan',
      barDetailedName: 'January 2025',
      sessionStatistics: {
        spentTimeSeconds: 0,
        sessionsAmount: 0,
        pausedAmount: 0,
      },
      adItems: [],
    },
    {
      startOfRange: new Date('2025-02-01T00:00:00.000Z'),
      endOfRange: new Date('2025-03-01T00:00:00.000Z'),
      barName: 'Feb',
      barDetailedName: 'February 2025',
      sessionStatistics: {
        spentTimeSeconds: 0,
        sessionsAmount: 0,
        pausedAmount: 0,
      },
      adItems: [],
    },
    {
      startOfRange: new Date('2025-03-01T00:00:00.000Z'),
      endOfRange: new Date('2025-04-01T00:00:00.000Z'),
      barName: 'Mar',
      barDetailedName: 'March 2025',
      sessionStatistics: {
        spentTimeSeconds: 9600,
        sessionsAmount: 12,
        pausedAmount: 8,
      },
      adItems: [],
    },
    {
      startOfRange: new Date('2025-04-01T00:00:00.000Z'),
      endOfRange: new Date('2025-05-01T00:00:00.000Z'),
      barName: 'Apr',
      barDetailedName: 'April 2025',
      sessionStatistics: {
        spentTimeSeconds: 0,
        sessionsAmount: 0,
        pausedAmount: 0,
      },
      adItems: [],
    },
    {
      startOfRange: new Date('2025-05-01T00:00:00.000Z'),
      endOfRange: new Date('2025-06-01T00:00:00.000Z'),
      barName: 'May',
      barDetailedName: 'May 2025',
      sessionStatistics: {
        spentTimeSeconds: 0,
        sessionsAmount: 0,
        pausedAmount: 0,
      },
      adItems: [],
    },
    {
      startOfRange: new Date('2025-06-01T00:00:00.000Z'),
      endOfRange: new Date('2025-07-01T00:00:00.000Z'),
      barName: 'Jun',
      barDetailedName: 'June 2025',
      sessionStatistics: {
        spentTimeSeconds: 0,
        sessionsAmount: 0,
        pausedAmount: 0,
      },
      adItems: [],
    },
    {
      startOfRange: new Date('2025-07-01T00:00:00.000Z'),
      endOfRange: new Date('2025-08-01T00:00:00.000Z'),
      barName: 'Jul',
      barDetailedName: 'July 2025',
      sessionStatistics: {
        spentTimeSeconds: 0,
        sessionsAmount: 0,
        pausedAmount: 0,
      },
      adItems: [],
    },
    {
      startOfRange: new Date('2025-08-01T00:00:00.000Z'),
      endOfRange: new Date('2025-09-01T00:00:00.000Z'),
      barName: 'Aug',
      barDetailedName: 'August 2025',
      sessionStatistics: {
        spentTimeSeconds: 0,
        sessionsAmount: 0,
        pausedAmount: 0,
      },
      adItems: [],
    },
    {
      startOfRange: new Date('2025-09-01T00:00:00.000Z'),
      endOfRange: new Date('2025-10-01T00:00:00.000Z'),
      barName: 'Sep',
      barDetailedName: 'September 2025',
      sessionStatistics: {
        spentTimeSeconds: 17562,
        sessionsAmount: 25,
        pausedAmount: 13,
      },
      adItems: [],
    },
    {
      startOfRange: new Date('2025-10-01T00:00:00.000Z'),
      endOfRange: new Date('2025-11-01T00:00:00.000Z'),
      barName: 'Oct',
      barDetailedName: 'October 2025',
      sessionStatistics: {
        spentTimeSeconds: 19980,
        sessionsAmount: 74,
        pausedAmount: 47,
      },
      adItems: [],
    },
    {
      startOfRange: new Date('2025-11-01T00:00:00.000Z'),
      endOfRange: new Date('2025-12-01T00:00:00.000Z'),
      barName: 'Nov',
      barDetailedName: 'November 2025',
      sessionStatistics: {
        spentTimeSeconds: 5926,
        sessionsAmount: 17,
        pausedAmount: 77,
      },
      adItems: [],
    },
    {
      startOfRange: new Date('2025-12-01T00:00:00.000Z'),
      endOfRange: new Date('2026-01-01T00:00:00.000Z'),
      barName: 'Dec',
      barDetailedName: 'December 2025',
      sessionStatistics: {
        spentTimeSeconds: 6688,
        sessionsAmount: 45,
        pausedAmount: 132,
      },
      adItems: [],
    },
  ];

  it('returns empty array when timeBars is empty', () => {
    const result = splitTimeBars([], 2, tEnMock as TFunction);
    expect(result).toEqual([]);
  });

  it('throws if parts is not positive', () => {
    expect(() => {
      splitTimeBars(timeBars, 0 as any, tEnMock as TFunction);
    }).toThrow('parts must be a positive integer');
  });

  it('throws if parts is not integer', () => {
    expect(() => {
      splitTimeBars(timeBars, 2.6 as any, tEnMock as TFunction);
    }).toThrow('parts must be a positive integer');
  });

  it('throws if there are more parts than timeBars length', () => {
    expect(() => {
      splitTimeBars(timeBars, 13, tEnMock as TFunction);
    }).toThrow('parts must be less or equal to timeBars length');
  });

  it('splits time bars into 1 segment if parts is 1', () => {
    const result = splitTimeBars(timeBars, 1, tEnMock as TFunction);
    expect(result.length).toBe(1);
    expect(result[0].startOfRange.getTime()).toBe(
      new Date('2025-01-01T00:00:00.000Z').getTime(),
    );
    expect(result[0].endOfRange.getTime()).toBe(
      new Date('2026-01-01T00:00:00.000Z').getTime(),
    );
  });

  it('splits time bars into 2 equal segments', () => {
    const result = splitTimeBars(timeBars, 2, tEnMock as TFunction);
    expect(result.length).toBe(2);

    expect(result[0].startOfRange.getTime()).toBe(
      new Date('2025-01-01T00:00:00.000Z').getTime(),
    );
    expect(result[0].endOfRange.getTime()).toBe(
      new Date('2025-07-01T00:00:00.000Z').getTime(),
    );

    expect(result[1].startOfRange.getTime()).toBe(
      new Date('2025-07-01T00:00:00.000Z').getTime(),
    );
    expect(result[1].endOfRange.getTime()).toBe(
      new Date('2026-01-01T00:00:00.000Z').getTime(),
    );
  });

  it('splits time bars into 3 equal segments', () => {
    const result = splitTimeBars(timeBars, 3, tEnMock as TFunction);
    expect(result.length).toBe(3);

    expect(result[0].startOfRange.getTime()).toBe(
      new Date('2025-01-01T00:00:00.000Z').getTime(),
    );
    expect(result[0].endOfRange.getTime()).toBe(
      new Date('2025-05-01T00:00:00.000Z').getTime(),
    );

    expect(result[1].startOfRange.getTime()).toBe(
      new Date('2025-05-01T00:00:00.000Z').getTime(),
    );
    expect(result[1].endOfRange.getTime()).toBe(
      new Date('2025-09-01T00:00:00.000Z').getTime(),
    );

    expect(result[2].startOfRange.getTime()).toBe(
      new Date('2025-09-01T00:00:00.000Z').getTime(),
    );
    expect(result[2].endOfRange.getTime()).toBe(
      new Date('2026-01-01T00:00:00.000Z').getTime(),
    );
  });

  it('splits time bars into 4 equal segments', () => {
    const result = splitTimeBars(timeBars, 4, tEnMock as TFunction);
    expect(result.length).toBe(4);

    expect(result[0].startOfRange.getTime()).toBe(
      new Date('2025-01-01T00:00:00.000Z').getTime(),
    );
    expect(result[0].endOfRange.getTime()).toBe(
      new Date('2025-04-01T00:00:00.000Z').getTime(),
    );

    expect(result[1].startOfRange.getTime()).toBe(
      new Date('2025-04-01T00:00:00.000Z').getTime(),
    );
    expect(result[1].endOfRange.getTime()).toBe(
      new Date('2025-07-01T00:00:00.000Z').getTime(),
    );

    expect(result[2].startOfRange.getTime()).toBe(
      new Date('2025-07-01T00:00:00.000Z').getTime(),
    );
    expect(result[2].endOfRange.getTime()).toBe(
      new Date('2025-10-01T00:00:00.000Z').getTime(),
    );

    expect(result[3].startOfRange.getTime()).toBe(
      new Date('2025-10-01T00:00:00.000Z').getTime(),
    );
    expect(result[3].endOfRange.getTime()).toBe(
      new Date('2026-01-01T00:00:00.000Z').getTime(),
    );
  });
});
