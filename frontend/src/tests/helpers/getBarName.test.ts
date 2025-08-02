import { getBarName, getBarDetailedName } from '../../helpers/barNaming';

describe('getBarName', () => {
  it('returns day of month when range type is "days"', () => {
    const startOfRange = new Date(2024, 6, 1, 0, 0, 0);
    const endOfRange = new Date(2024, 6, 2, 0, 0, 0);

    const result = getBarName({ startOfRange, endOfRange });
    expect(result).toBe('1');
  });

  it('returns day of month when duration < 1 day', () => {
    const startOfRange = new Date(2024, 6, 1, 0, 0, 0);
    const endOfRange = new Date(2024, 6, 1, 12, 0, 0);

    const result = getBarName({ startOfRange, endOfRange });
    expect(result).toBe('1');
  });

  it('returns month name when range type is "months"', () => {
    const startOfRange = new Date(2024, 6, 1, 0, 0, 0);
    const endOfRange = new Date(2024, 7, 1, 0, 0, 0);

    const result = getBarName({ startOfRange, endOfRange });
    expect(result).toBe('Jul');
  });

  it('returns range like "Jul 1 - Aug 8" when duration > 1 day and type is not "months"', () => {
    const startOfRange = new Date(2024, 6, 1, 0, 0, 0);
    const endOfRange = new Date(2024, 7, 8, 0, 0, 0);

    const result = getBarName({ startOfRange, endOfRange });
    expect(result).toBe('Jul 1 - Aug 8');
  });
});

describe('getBarDetailedName', () => {
  it('returns full date string when range type is "days"', () => {
    const startOfRange = new Date(2024, 6, 1, 0, 0, 0); // July 1, 2024
    const endOfRange = new Date(2024, 6, 2, 0, 0, 0); // July 2, 2024

    const result = getBarDetailedName({ startOfRange, endOfRange });

    expect(result).toBe(startOfRange.toDateString());
  });

  it('returns time range when duration < 1 day', () => {
    const startOfRange = new Date(2024, 6, 1, 9, 30, 0); // Jul 1, 09:30
    const endOfRange = new Date(2024, 6, 1, 14, 45, 0); // Jul 1, 14:45

    const result = getBarDetailedName({ startOfRange, endOfRange });

    expect(result).toBe(`${startOfRange.toDateString()} 09:30 - 14:45`);
  });

  it('returns month detailed name when range type is "months"', () => {
    const startOfRange = new Date(2024, 6, 1, 0, 0, 0); // July 1
    const endOfRange = new Date(2024, 7, 1, 0, 0, 0); // August 1

    const result = getBarDetailedName({ startOfRange, endOfRange });

    expect(result).toBe('July 2024');
  });

  it('returns detailed range with dates and times for long custom ranges', () => {
    const startOfRange = new Date(2024, 6, 1, 8, 15, 0); // Jul 1 08:15
    const endOfRange = new Date(2024, 7, 5, 19, 45, 0); // Aug 5 19:45

    const result = getBarDetailedName({ startOfRange, endOfRange });

    expect(result).toBe('Jul 1 08:15 - Aug 5 19:45');
  });
});
