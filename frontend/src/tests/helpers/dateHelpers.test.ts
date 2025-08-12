import {
  getWeekDays,
  shiftWeekDays,
  getFiveMonths,
  shiftFiveMonths,
  getTwoYears,
  shiftTwoYears,
  getDayRange,
  getWeekRange,
  getMonthRange,
  getYearRange,
  isStartOfDay,
  isEndOfDay,
  isSameDay,
  getRangeType,
  toLocalISOString,
} from '../../helpers/dateHelpers';

describe('getWeekDays', () => {
  it('should return 7 dates starting from Monday when input is a Wednesday', () => {
    const input = new Date('2023-08-09'); // Wednesday
    const result = getWeekDays(input);

    expect(result).toHaveLength(7);
    expect(result[0].getDay()).toBe(1); // Monday
    expect(result[0].toDateString()).toBe(
      new Date('2023-08-07').toDateString()
    );
    expect(result[6].toDateString()).toBe(
      new Date('2023-08-13').toDateString()
    );
  });

  it('should return correct week when date is a Monday', () => {
    const input = new Date('2023-08-07'); // Monday
    const result = getWeekDays(input);

    expect(result).toHaveLength(7);
    expect(result[0].getDay()).toBe(1);
    expect(result[0].toDateString()).toBe(input.toDateString());
  });

  it('should return correct week when date is a Sunday', () => {
    const input = new Date('2025-08-17'); // Sunday
    const result = getWeekDays(input);

    expect(result).toHaveLength(7);
    expect(result[0].getDay()).toBe(1); // Monday
    expect(result[0].toDateString()).toBe(
      new Date('2025-08-11').toDateString()
    );
    expect(result[6].getDay()).toBe(0); // Sunday
  });
});

describe('shiftWeekDays', () => {
  const baseWeek = [
    new Date('2023-08-07'), // Monday
    new Date('2023-08-08'),
    new Date('2023-08-09'),
    new Date('2023-08-10'),
    new Date('2023-08-11'),
    new Date('2023-08-12'),
    new Date('2023-08-13'), // Sunday
  ];

  it('should shift all dates 7 days forward when right is true', () => {
    const shifted = shiftWeekDays(baseWeek, true);

    shifted.forEach((date, i) => {
      const expected = new Date(baseWeek[i]);
      expected.setDate(expected.getDate() + 7);
      expect(date.toDateString()).toBe(expected.toDateString());
    });
  });

  it('should shift all dates 7 days backward when right is false', () => {
    const shifted = shiftWeekDays(baseWeek, false);
    shifted.forEach((date, i) => {
      const expected = new Date(baseWeek[i]);
      expected.setDate(expected.getDate() - 7);
      expect(date.toDateString()).toBe(expected.toDateString());
    });
  });

  it('should return an array of exactly 7 dates', () => {
    const shifted = shiftWeekDays(baseWeek, true);
    expect(shifted).toHaveLength(7);
    shifted.forEach((date) => expect(date instanceof Date).toBe(true));
  });
});

describe('getFiveMonths', () => {
  it('should return 5 months with the middle one equal to the input', () => {
    const middle = new Date('2023-08-15');
    const result = getFiveMonths(middle);

    expect(result).toHaveLength(5);
    expect(result[2].getMonth()).toBe(7); // August (0-indexed)
    expect(result[2].getFullYear()).toBe(2023);
  });

  it('should return months in correct order (2 before, current, 2 after)', () => {
    const date = new Date('2023-06-01');
    const result = getFiveMonths(date);

    const months = result.map((d) => d.getMonth());
    expect(months).toEqual([3, 4, 5, 6, 7]); // Apr, May, Jun, Jul, Aug
  });

  it('should handle year change going backward (e.g., January)', () => {
    const date = new Date('2024-01-10');
    const result = getFiveMonths(date);

    const months = result.map((d) => d.getMonth());
    const years = result.map((d) => d.getFullYear());

    expect(months).toEqual([10, 11, 0, 1, 2]); // Nov, Dec, Jan, Feb, Mar
    expect(years).toEqual([2023, 2023, 2024, 2024, 2024]);
  });

  it('should handle year change going forward (e.g., December)', () => {
    const date = new Date('2022-12-20');
    const result = getFiveMonths(date);

    const months = result.map((d) => d.getMonth());
    const years = result.map((d) => d.getFullYear());

    expect(months).toEqual([9, 10, 11, 0, 1]); // Oct, Nov, Dec, Jan, Feb
    expect(years).toEqual([2022, 2022, 2022, 2023, 2023]);
  });
});

describe('shiftFiveMonths', () => {
  it('should shift all months 5 forward when right is true', () => {
    const input = [
      new Date('2023-01-01'),
      new Date('2023-02-01'),
      new Date('2023-03-01'),
      new Date('2023-04-01'),
      new Date('2023-05-01'),
    ];

    const result = shiftFiveMonths(input, true);
    const months = result.map((d) => d.getMonth());
    const years = result.map((d) => d.getFullYear());

    expect(months).toEqual([5, 6, 7, 8, 9]); // Jun to Oct
    expect(years).toEqual([2023, 2023, 2023, 2023, 2023]);
  });

  it('should shift all months 5 backward when right is false', () => {
    const input = [
      new Date('2023-06-01'),
      new Date('2023-07-01'),
      new Date('2023-08-01'),
      new Date('2023-09-01'),
      new Date('2023-10-01'),
    ];

    const result = shiftFiveMonths(input, false);
    const months = result.map((d) => d.getMonth());
    const years = result.map((d) => d.getFullYear());

    expect(months).toEqual([0, 1, 2, 3, 4]); // Jan to May
    expect(years).toEqual([2023, 2023, 2023, 2023, 2023]);
  });

  it('should handle year change when shifting forward', () => {
    const input = [
      new Date('2023-09-01'),
      new Date('2023-10-01'),
      new Date('2023-11-01'),
      new Date('2023-12-01'),
      new Date('2024-01-01'),
    ];

    const result = shiftFiveMonths(input, true);
    const months = result.map((d) => d.getMonth());
    const years = result.map((d) => d.getFullYear());

    expect(months).toEqual([1, 2, 3, 4, 5]); // Feb to May
    expect(years).toEqual([2024, 2024, 2024, 2024, 2024]);
  });

  it('should handle year change when shifting backward', () => {
    const input = [
      new Date('2024-03-01'),
      new Date('2024-04-01'),
      new Date('2024-05-01'),
      new Date('2024-06-01'),
      new Date('2024-07-01'),
    ];

    const result = shiftFiveMonths(input, false);
    const months = result.map((d) => d.getMonth());
    const years = result.map((d) => d.getFullYear());

    expect(months).toEqual([9, 10, 11, 0, 1]); // Oct to Feb
    expect(years).toEqual([2023, 2023, 2023, 2024, 2024]);
  });
});

describe('getTwoYear', () => {
  it('should return the current year and the previous year', () => {
    const input = new Date('2025-08-07');

    const result = getTwoYears(input);
    expect(result).toHaveLength(2);

    expect(result[0].getFullYear()).toBe(2024);
    expect(result[1].getFullYear()).toBe(2025);
  });
});

describe('shiftTwoYear', () => {
  it('should shift both years 2 years forward when right is true', () => {
    const input = [new Date('2022-01-01'), new Date('2023-01-01')];
    const result = shiftTwoYears(input, true);

    expect(result[0].getFullYear()).toBe(2024);
    expect(result[1].getFullYear()).toBe(2025);
  });

  it('should shift both years 2 years backward when right is false', () => {
    const input = [new Date('2022-06-15'), new Date('2023-06-15')];
    const result = shiftTwoYears(input, false);

    expect(result[0].getFullYear()).toBe(2020);
    expect(result[1].getFullYear()).toBe(2021);
  });
});

describe('getDayRange', () => {
  it('should return start and end of the given day', () => {
    const input = new Date('2025-08-07T15:45:00');
    const [start, end] = getDayRange(input);

    expect(start.getFullYear()).toBe(2025);
    expect(start.getMonth()).toBe(7); // August (0-based)
    expect(start.getDate()).toBe(7);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);

    expect(end.getFullYear()).toBe(2025);
    expect(end.getMonth()).toBe(7);
    expect(end.getDate()).toBe(8);
    expect(end.getHours()).toBe(0);
    expect(end.getMinutes()).toBe(0);
    expect(end.getSeconds()).toBe(0);
    expect(end.getMilliseconds()).toBe(0);
  });

  it('should return a 24 hour range', () => {
    const input = new Date('2024-02-29T12:00:00'); // Leap year
    const [start, end] = getDayRange(input);

    const diff = end.getTime() - start.getTime();
    expect(diff).toBe(24 * 60 * 60 * 1000); // 24 hours in ms
  });
});

describe('getWeekRange', () => {
  it('should return correct Monday and Sunday for a weekday (Wednesday)', () => {
    const date = new Date('2025-08-06T15:00:00'); // Wednesday
    const [monday, sunday] = getWeekRange(date);

    expect(monday.getDay()).toBe(1); // Monday
    expect(monday.getHours()).toBe(0);
    expect(monday.getMinutes()).toBe(0);
    expect(monday.getSeconds()).toBe(0);
    expect(monday.getMilliseconds()).toBe(0);

    expect(sunday.getDay()).toBe(0); // Sunday
    expect(sunday.getHours()).toBe(23);
    expect(sunday.getMinutes()).toBe(59);
    expect(sunday.getSeconds()).toBe(59);
    expect(sunday.getMilliseconds()).toBe(999);

    expect(monday <= date && date <= sunday).toBe(true);
  });

  it('should handle Sunday properly', () => {
    const sundayDate = new Date('2025-08-10T10:00:00'); // Sunday
    const [monday, sunday] = getWeekRange(sundayDate);

    expect(monday.getDay()).toBe(1); // Monday
    expect(monday.getDate()).toBe(4); // 4th Aug

    expect(sunday.getDay()).toBe(0);
    expect(sunday.getDate()).toBe(monday.getDate() + 6);
  });

  it('should return a 7-day range from Monday to Sunday', () => {
    const date = new Date('2023-11-15'); // Wednesday
    const [monday, sunday] = getWeekRange(date);
    const diff = sunday.getTime() - monday.getTime();

    // Exactly 7 days minus 1 ms
    expect(diff).toBe(7 * 24 * 60 * 60 * 1000 - 1);
  });
});

describe('getMonthRange', () => {
  it('should return the first day of the month at 00:00:00.000', () => {
    const date = new Date('2023-08-15T12:34:56');
    const [start, _] = getMonthRange(date);

    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
    expect(start.getMonth()).toBe(date.getMonth());
  });

  it('should return the first day of the next month at 00:00:00.000 as end of range', () => {
    const date = new Date('2023-08-15T12:34:56');
    const [_, end] = getMonthRange(date);

    // end should be the first day of next month
    expect(end.getDate()).toBe(1);
    expect(end.getHours()).toBe(0);
    expect(end.getMinutes()).toBe(0);
    expect(end.getSeconds()).toBe(0);
    expect(end.getMilliseconds()).toBe(0);

    const expectedMonth = (date.getMonth() + 1) % 12;
    expect(end.getMonth()).toBe(expectedMonth);
  });

  it('should work correctly on December to January boundary', () => {
    const date = new Date('2023-12-20T10:00:00');
    const [start, end] = getMonthRange(date);

    expect(start.getMonth()).toBe(11); // December
    expect(end.getMonth()).toBe(0); // January next year

    expect(end.getFullYear()).toBe(start.getFullYear() + 1);
  });
});

describe('getYearRange', () => {
  it('should return start of the year at January 1, 00:00:00.000', () => {
    const date = new Date('2023-06-15T12:34:56');
    const [start, _] = getYearRange(date);

    expect(start.getFullYear()).toBe(date.getFullYear());
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
  });

  it('should return end of the year as January 1 of the next year at 00:00:00.000', () => {
    const date = new Date('2023-06-15T12:34:56');
    const [_, end] = getYearRange(date);

    expect(end.getFullYear()).toBe(date.getFullYear() + 1);
    expect(end.getMonth()).toBe(0);
    expect(end.getDate()).toBe(1);
    expect(end.getHours()).toBe(0);
    expect(end.getMinutes()).toBe(0);
    expect(end.getSeconds()).toBe(0);
    expect(end.getMilliseconds()).toBe(0);
  });

  it('should correctly handle leap years', () => {
    const date = new Date('2020-07-01T10:00:00'); // leap year
    const [start, end] = getYearRange(date);

    expect(start.getFullYear()).toBe(2020);
    expect(end.getFullYear()).toBe(2021);
  });
});

describe('isStartOfDay', () => {
  it('returns true for date at 00:00:00.000', () => {
    const date = new Date(2023, 0, 1, 0, 0, 0, 0);
    expect(isStartOfDay(date)).toBe(true);
  });

  it('returns false if hours, minutes, seconds or ms are not zero', () => {
    const dates = [
      new Date(2023, 0, 1, 1, 0, 0, 0),
      new Date(2023, 0, 1, 0, 1, 0, 0),
      new Date(2023, 0, 1, 0, 0, 1, 0),
      new Date(2023, 0, 1, 0, 0, 0, 1),
    ];

    dates.forEach((d) => {
      expect(isStartOfDay(d)).toBe(false);
    });
  });
});

describe('isEndOfDay', () => {
  it('returns true for date at 23:59:59.999', () => {
    const date = new Date(2023, 0, 1, 23, 59, 59, 999);
    expect(isEndOfDay(date)).toBe(true);
  });

  it('returns false if hours, minutes, seconds or ms are not exact end of day', () => {
    const dates = [
      new Date(2023, 0, 1, 23, 59, 59, 998),
      new Date(2023, 0, 1, 23, 59, 58, 999),
      new Date(2023, 0, 1, 23, 58, 59, 999),
      new Date(2023, 0, 1, 22, 59, 59, 999),
    ];

    dates.forEach((d) => {
      expect(isEndOfDay(d)).toBe(false);
    });
  });
});

describe('isSameDay', () => {
  it('returns true if both dates are on the same calendar day', () => {
    const d1 = new Date(2023, 5, 10, 10, 0, 0);
    const d2 = new Date(2023, 5, 10, 23, 59, 59);
    expect(isSameDay(d1, d2)).toBe(true);
  });

  it('returns false if dates are on different days', () => {
    const d1 = new Date(2023, 5, 10, 23, 59, 59);
    const d2 = new Date(2023, 5, 11, 0, 0, 0);
    expect(isSameDay(d1, d2)).toBe(false);
  });

  it('returns false if dates are in different months or years', () => {
    expect(isSameDay(new Date(2023, 0, 1), new Date(2023, 1, 1))).toBe(false);
    expect(isSameDay(new Date(2023, 0, 1), new Date(2024, 0, 1))).toBe(false);
  });
});

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
