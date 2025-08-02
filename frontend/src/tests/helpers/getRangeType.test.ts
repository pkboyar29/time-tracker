import { getRangeType } from '../../helpers/dateHelpers';

describe('getRangeType', () => {
  it('should return "days" for one full day range', () => {
    const fromDate = new Date(2023, 6, 1, 0, 0, 0, 0); // July 1, 2023
    const toDate = new Date(2023, 6, 2, 0, 0, 0, 0); // July 2, 2023

    expect(getRangeType(fromDate, toDate)).toBe('days');
  });

  it('should return "weeks" for full week (Mon to Sun, full day)', () => {
    const fromDate = new Date(2023, 6, 3, 0, 0, 0, 0); // Monday, July 3, 2023
    const toDate = new Date(2023, 6, 9, 23, 59, 59, 999); // Sunday, July 9, 2023

    expect(getRangeType(fromDate, toDate)).toBe('weeks');
  });

  it('should return "months" for full calendar month', () => {
    const fromDate = new Date(2023, 6, 1, 0, 0, 0, 0); // July 1, 2023
    const toDate = new Date(2023, 7, 1, 0, 0, 0, 0); // August 1, 2023

    expect(getRangeType(fromDate, toDate)).toBe('months');
  });

  it('should return "years" for full calendar year', () => {
    const fromDate = new Date(2023, 0, 1, 0, 0, 0, 0); // Jan 1, 2023
    const toDate = new Date(2024, 0, 1, 0, 0, 0, 0); // Jan 1, 2024

    expect(getRangeType(fromDate, toDate)).toBe('years');
  });

  it('should return "custom" for time offsets or partial range', () => {
    const fromDate = new Date(2023, 6, 1, 12, 0, 0, 0); // July 1, 12:00 PM
    const toDate = new Date(2023, 6, 2, 12, 0, 0, 0); // July 2, 12:00 PM

    expect(getRangeType(fromDate, toDate)).toBe('custom');
  });

  it('should return "custom" if not full week (wrong end time)', () => {
    const fromDate = new Date(2023, 6, 3, 0, 0, 0, 0); // Monday
    const toDate = new Date(2023, 6, 9, 23, 59, 59, 998); // Sunday but 1 ms too early

    expect(getRangeType(fromDate, toDate)).toBe('custom');
  });

  it('should return "months" for December to January (new year)', () => {
    const fromDate = new Date(2023, 11, 1, 0, 0, 0, 0); // Dec 1
    const toDate = new Date(2024, 0, 1, 0, 0, 0, 0); // Jan 1

    expect(getRangeType(fromDate, toDate)).toBe('months');
  });

  it('should return "custom" if month range not from first day', () => {
    const fromDate = new Date(2023, 6, 2, 0, 0, 0, 0); // July 2
    const toDate = new Date(2023, 7, 2, 0, 0, 0, 0); // August 2

    expect(getRangeType(fromDate, toDate)).toBe('custom');
  });
});
