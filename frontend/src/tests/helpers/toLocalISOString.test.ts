import { toLocalISOString } from '../../helpers/dateHelpers';

describe('toLocalISOString', () => {
  it('should return correct ISO string in local time', () => {
    const date = new Date(2025, 6, 23, 15, 30, 45); // 23 июля 2025, 15:30:45
    const result = toLocalISOString(date);
    expect(result).toBe('2025-07-23T15:30:45');
  });

  it('should pad single-digit values with leading zeros', () => {
    const date = new Date(2025, 0, 5, 2, 4, 9); // 5 января 2025, 02:04:09
    const result = toLocalISOString(date);
    expect(result).toBe('2025-01-05T02:04:09');
  });

  it('should correctly handle start of month/day/hour values', () => {
    const date = new Date(2025, 8, 1, 0, 0, 0); // 1 сентября 2025, 00:00:00
    const result = toLocalISOString(date);
    expect(result).toBe('2025-09-01T00:00:00');
  });

  it('should return a string with a length of 19 characters', () => {
    const date = new Date(2025, 6, 23, 15, 30, 45);
    const result = toLocalISOString(date);
    expect(result.length).toBe(19);
  });
});
