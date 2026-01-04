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
  it('returns empty array when adsList is empty', () => {
    const result = mergeActivityDistributions([]);
    expect(result).toEqual([]);
  });

  it('returns the same array when adsList contains a single element', () => {
    const ad: IActivityDistribution[] = [
      {
        activityName: 'Coding',
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 600,
          pausedAmount: 0,
        },
        spentTimePercentage: 0.6,
        fill: '#fff',
      },
    ];

    const result = mergeActivityDistributions([ad]);

    expect(result).toBe(ad);
  });

  it('merges distributions with the same activityName', () => {
    const adsList: IActivityDistribution[][] = [
      [
        {
          activityName: 'Coding',
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 300,
            pausedAmount: 0,
          },
          spentTimePercentage: 0.5,
          fill: '#111',
        },
        {
          activityName: 'Reading',
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 300,
            pausedAmount: 0,
          },
          spentTimePercentage: 0.5,
          fill: '#222',
        },
      ],
      [
        {
          activityName: 'Coding',
          sessionStatistics: {
            sessionsAmount: 2,
            spentTimeSeconds: 600,
            pausedAmount: 1,
          },
          spentTimePercentage: 1,
          fill: '#111',
        },
      ],
    ];

    const result = mergeActivityDistributions(adsList);

    expect(result).toEqual([
      {
        activityName: 'Coding',
        sessionStatistics: {
          sessionsAmount: 3,
          spentTimeSeconds: 900,
          pausedAmount: 1,
        },
        spentTimePercentage: 0.75,
        fill: '#111',
      },
      {
        activityName: 'Reading',
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 300,
          pausedAmount: 0,
        },
        spentTimePercentage: 0.25,
        fill: '#222',
      },
    ]);
  });

  it('keeps activities that do not match by activityName', () => {
    const adsList: IActivityDistribution[][] = [
      [
        {
          activityName: 'Coding',
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 300,
            pausedAmount: 0,
          },
          spentTimePercentage: 1,
          fill: '#111',
        },
      ],
      [
        {
          activityName: 'Reading',
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 200,
            pausedAmount: 0,
          },
          spentTimePercentage: 1,
          fill: '#222',
        },
      ],
    ];

    const result = mergeActivityDistributions(adsList);

    expect(result).toEqual([
      {
        activityName: 'Coding',
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 300,
          pausedAmount: 0,
        },
        spentTimePercentage: 0.6,
        fill: '#111',
      },
      {
        activityName: 'Reading',
        sessionStatistics: {
          sessionsAmount: 1,
          spentTimeSeconds: 200,
          pausedAmount: 0,
        },
        spentTimePercentage: 0.4,
        fill: '#222',
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
      adItems: [
        {
          activityName: 'intensives',
          sessionStatistics: {
            sessionsAmount: 6,
            spentTimeSeconds: 9000,
            pausedAmount: 6,
          },
          spentTimePercentage: 0.15,
          fill: '#97bc82',
        },
        {
          activityName: 'Without activity',
          sessionStatistics: {
            sessionsAmount: 6,
            spentTimeSeconds: 600,
            pausedAmount: 2,
          },
          spentTimePercentage: 0.01,
          fill: '#bbde2e',
        },
      ],
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
      adItems: [
        {
          activityName: 'intensives',
          sessionStatistics: {
            sessionsAmount: 7,
            spentTimeSeconds: 3700,
            pausedAmount: 4,
          },
          spentTimePercentage: 0.06,
          fill: '#97bc82',
        },
        {
          activityName: 'rabbitMQ',
          sessionStatistics: {
            sessionsAmount: 3,
            spentTimeSeconds: 180,
            pausedAmount: 0,
          },
          spentTimePercentage: 0,
          fill: '#dd7aa1',
        },
        {
          activityName: 'kafka',
          sessionStatistics: {
            sessionsAmount: 2,
            spentTimeSeconds: 1740,
            pausedAmount: 1,
          },
          spentTimePercentage: 0.03,
          fill: '#e2c23c',
        },
        {
          activityName: 'activity 1',
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 60,
            pausedAmount: 0,
          },
          spentTimePercentage: 0,
          fill: '#dfdc50',
        },
        {
          activityName: 'Without activity',
          sessionStatistics: {
            sessionsAmount: 12,
            spentTimeSeconds: 11882,
            pausedAmount: 8,
          },
          spentTimePercentage: 0.2,
          fill: '#bbde2e',
        },
      ],
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
      adItems: [
        {
          activityName: 'intensives',
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 1460,
            pausedAmount: 0,
          },
          spentTimePercentage: 0.02,
          fill: '#97bc82',
        },
        {
          activityName: 'rabbitMQ',
          sessionStatistics: {
            sessionsAmount: 7,
            spentTimeSeconds: 1226,
            pausedAmount: 4,
          },
          spentTimePercentage: 0.02,
          fill: '#dd7aa1',
        },
        {
          activityName: 'kafka',
          sessionStatistics: {
            sessionsAmount: 15,
            spentTimeSeconds: 3280,
            pausedAmount: 11,
          },
          spentTimePercentage: 0.05,
          fill: '#e2c23c',
        },
        {
          activityName: 'activity 1',
          sessionStatistics: {
            sessionsAmount: 6,
            spentTimeSeconds: 480,
            pausedAmount: 0,
          },
          spentTimePercentage: 0.01,
          fill: '#dfdc50',
        },
        {
          activityName: 'new activity 1',
          sessionStatistics: {
            sessionsAmount: 4,
            spentTimeSeconds: 240,
            pausedAmount: 0,
          },
          spentTimePercentage: 0,
          fill: '#f77fd5',
        },
        {
          activityName: 'new activity 2',
          sessionStatistics: {
            sessionsAmount: 7,
            spentTimeSeconds: 4080,
            pausedAmount: 2,
          },
          spentTimePercentage: 0.07,
          fill: '#737fc8',
        },
        {
          activityName: 'new activity 3',
          sessionStatistics: {
            sessionsAmount: 4,
            spentTimeSeconds: 240,
            pausedAmount: 1,
          },
          spentTimePercentage: 0,
          fill: '#4ee4de',
        },
        {
          activityName: 'activity with big name big name big name big',
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 60,
            pausedAmount: 0,
          },
          spentTimePercentage: 0,
          fill: '#76fd88',
        },
        {
          activityName: 'Without activity',
          sessionStatistics: {
            sessionsAmount: 29,
            spentTimeSeconds: 8914,
            pausedAmount: 29,
          },
          spentTimePercentage: 0.15,
          fill: '#bbde2e',
        },
      ],
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
      adItems: [
        {
          activityName: 'rabbitMQ',
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 394,
            pausedAmount: 18,
          },
          spentTimePercentage: 0.01,
          fill: '#dd7aa1',
        },
        {
          activityName: 'kafka',
          sessionStatistics: {
            sessionsAmount: 2,
            spentTimeSeconds: 1600,
            pausedAmount: 9,
          },
          spentTimePercentage: 0.03,
          fill: '#e2c23c',
        },
        {
          activityName: 'new activity 1',
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 1180,
            pausedAmount: 28,
          },
          spentTimePercentage: 0.02,
          fill: '#f77fd5',
        },
        {
          activityName: 'new activity 2',
          sessionStatistics: {
            sessionsAmount: 2,
            spentTimeSeconds: 120,
            pausedAmount: 1,
          },
          spentTimePercentage: 0,
          fill: '#737fc8',
        },
        {
          activityName: 'Without activity',
          sessionStatistics: {
            sessionsAmount: 11,
            spentTimeSeconds: 2632,
            pausedAmount: 21,
          },
          spentTimePercentage: 0.04,
          fill: '#bbde2e',
        },
      ],
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
      adItems: [
        {
          activityName: 'intensives',
          sessionStatistics: {
            sessionsAmount: 2,
            spentTimeSeconds: 120,
            pausedAmount: 1,
          },
          spentTimePercentage: 0,
          fill: '#97bc82',
        },
        {
          activityName: 'kafka',
          sessionStatistics: {
            sessionsAmount: 7,
            spentTimeSeconds: 720,
            pausedAmount: 18,
          },
          spentTimePercentage: 0.01,
          fill: '#e2c23c',
        },
        {
          activityName: 'activity 1',
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 168,
            pausedAmount: 0,
          },
          spentTimePercentage: 0,
          fill: '#dfdc50',
        },
        {
          activityName: 'activity 5',
          sessionStatistics: {
            sessionsAmount: 2,
            spentTimeSeconds: 120,
            pausedAmount: 0,
          },
          spentTimePercentage: 0,
          fill: '#795bfc',
        },
        {
          activityName: 'new activity 1',
          sessionStatistics: {
            sessionsAmount: 1,
            spentTimeSeconds: 380,
            pausedAmount: 12,
          },
          spentTimePercentage: 0.01,
          fill: '#f77fd5',
        },
        {
          activityName: 'new activity 2',
          sessionStatistics: {
            sessionsAmount: 0,
            spentTimeSeconds: 1285,
            pausedAmount: 32,
          },
          spentTimePercentage: 0.02,
          fill: '#737fc8',
        },
        {
          activityName: 'Without activity',
          sessionStatistics: {
            sessionsAmount: 32,
            spentTimeSeconds: 3895,
            pausedAmount: 69,
          },
          spentTimePercentage: 0.07,
          fill: '#bbde2e',
        },
      ],
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
      new Date('2025-01-01T00:00:00.000Z').getTime()
    );
    expect(result[0].endOfRange.getTime()).toBe(
      new Date('2026-01-01T00:00:00.000Z').getTime()
    );
  });

  it('splits time bars into 2 equal segments', () => {
    const result = splitTimeBars(timeBars, 2, tEnMock as TFunction);
    expect(result.length).toBe(2);

    expect(result[0].startOfRange.getTime()).toBe(
      new Date('2025-01-01T00:00:00.000Z').getTime()
    );
    expect(result[0].endOfRange.getTime()).toBe(
      new Date('2025-07-01T00:00:00.000Z').getTime()
    );

    expect(result[1].startOfRange.getTime()).toBe(
      new Date('2025-07-01T00:00:00.000Z').getTime()
    );
    expect(result[1].endOfRange.getTime()).toBe(
      new Date('2026-01-01T00:00:00.000Z').getTime()
    );
  });

  it('splits time bars into 3 equal segments', () => {
    const result = splitTimeBars(timeBars, 3, tEnMock as TFunction);
    expect(result.length).toBe(3);

    expect(result[0].startOfRange.getTime()).toBe(
      new Date('2025-01-01T00:00:00.000Z').getTime()
    );
    expect(result[0].endOfRange.getTime()).toBe(
      new Date('2025-05-01T00:00:00.000Z').getTime()
    );

    expect(result[1].startOfRange.getTime()).toBe(
      new Date('2025-05-01T00:00:00.000Z').getTime()
    );
    expect(result[1].endOfRange.getTime()).toBe(
      new Date('2025-09-01T00:00:00.000Z').getTime()
    );

    expect(result[2].startOfRange.getTime()).toBe(
      new Date('2025-09-01T00:00:00.000Z').getTime()
    );
    expect(result[2].endOfRange.getTime()).toBe(
      new Date('2026-01-01T00:00:00.000Z').getTime()
    );
  });

  it('splits time bars into 4 equal segments', () => {
    const result = splitTimeBars(timeBars, 4, tEnMock as TFunction);
    expect(result.length).toBe(4);

    expect(result[0].startOfRange.getTime()).toBe(
      new Date('2025-01-01T00:00:00.000Z').getTime()
    );
    expect(result[0].endOfRange.getTime()).toBe(
      new Date('2025-04-01T00:00:00.000Z').getTime()
    );

    expect(result[1].startOfRange.getTime()).toBe(
      new Date('2025-04-01T00:00:00.000Z').getTime()
    );
    expect(result[1].endOfRange.getTime()).toBe(
      new Date('2025-07-01T00:00:00.000Z').getTime()
    );

    expect(result[2].startOfRange.getTime()).toBe(
      new Date('2025-07-01T00:00:00.000Z').getTime()
    );
    expect(result[2].endOfRange.getTime()).toBe(
      new Date('2025-10-01T00:00:00.000Z').getTime()
    );

    expect(result[3].startOfRange.getTime()).toBe(
      new Date('2025-10-01T00:00:00.000Z').getTime()
    );
    expect(result[3].endOfRange.getTime()).toBe(
      new Date('2026-01-01T00:00:00.000Z').getTime()
    );
  });
});
