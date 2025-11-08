import {
  getRemainingTimeHoursMinutesSeconds,
  getTimeHMS,
  getReadableTimeHMS,
  getTimeHHmmFromDate,
} from '../../helpers/timeHelpers';

describe('getRemainingTimeHoursMinutesSeconds', () => {
  it('returns full format when hours, minutes and seconds are present', () => {
    const result = getRemainingTimeHoursMinutesSeconds(7205, 5); // 2h 0m 0s
    expect(result).toBe('02:00:00');
  });

  it('returns format with minutes and seconds when no hours', () => {
    const result = getRemainingTimeHoursMinutesSeconds(300, 60); // 4m 0s
    expect(result).toBe('00:04:00');
  });

  it('returns format with only seconds', () => {
    const result = getRemainingTimeHoursMinutesSeconds(10, 5); // 0m 5s
    expect(result).toBe('00:00:05');
  });

  it('formats minutes and seconds with leading zeros', () => {
    const result = getRemainingTimeHoursMinutesSeconds(3665, 3600); // 1m 5s
    expect(result).toBe('00:01:05');
  });

  it('omits hours if zero', () => {
    const result = getRemainingTimeHoursMinutesSeconds(3599, 0); // 59m 59s
    expect(result).toBe('00:59:59');
  });

  it('returns only minutes and seconds when less than an hour remains and short is true', () => {
    const result = getRemainingTimeHoursMinutesSeconds(3599, 0, true); // 59m 59s
    expect(result).toBe('59:59');
  });

  it('returns "00:00" when no time remains', () => {
    const result = getRemainingTimeHoursMinutesSeconds(100, 100);
    expect(result).toBe('00:00:00');
  });

  it('handles negative remaining time by showing 00:00', () => {
    const result = getRemainingTimeHoursMinutesSeconds(50, 100);
    expect(result).toBe('00:00');
  });
});

describe('getTimeHMS', () => {
  it('formats full time correctly with hours, minutes, and seconds', () => {
    const result = getTimeHMS(3665); // 1h 1m 5s
    expect(result).toBe('01:01:05');
  });

  it('formats time with leading zeros in hours, minutes, and seconds', () => {
    const result = getTimeHMS(5); // 0h 0m 5s
    expect(result).toBe('00:00:05');
  });

  it('formats time with minutes and seconds only', () => {
    const result = getTimeHMS(125); // 0h 2m 5s
    expect(result).toBe('00:02:05');
  });

  it('formats exactly one hour', () => {
    const result = getTimeHMS(3600); // 1h 0m 0s
    expect(result).toBe('01:00:00');
  });

  it('formats exactly one minute', () => {
    const result = getTimeHMS(60); // 0h 1m 0s
    expect(result).toBe('00:01:00');
  });

  it('formats zero seconds', () => {
    const result = getTimeHMS(0); // 0h 0m 0s
    expect(result).toBe('00:00:00');
  });

  it('formats large time values correctly', () => {
    const result = getTimeHMS(37230); // 10h 20m 30s
    expect(result).toBe('10:20:30');
  });
});

describe('getReadableTimeHMS', () => {
  it('returns only seconds when input is less than 1 minute and short is false', () => {
    const result = getReadableTimeHMS(3);
    expect(result).toBe('3 seconds');
  });

  it('returns only seconds when input is less than 1 minute and short is true', () => {
    const result = getReadableTimeHMS(14, true);
    expect(result).toBe('14s');
  });

  it('returns only minutes when hours are 0 and short is false', () => {
    const result = getReadableTimeHMS(150); // 2m 30s
    expect(result).toBe('2 minutes');
  });

  it('returns only minutes when hours are 0 and short is true', () => {
    const result = getReadableTimeHMS(120, true); // 2m
    expect(result).toBe('2m');
  });

  it('returns only hours when minutes are 0 and short is false', () => {
    const result = getReadableTimeHMS(3600); // 1h
    expect(result).toBe('1 hours');
  });

  it('returns only hours when minutes are 0 and short is true', () => {
    const result = getReadableTimeHMS(7200, true); // 2h
    expect(result).toBe('2h');
  });

  it('returns hours and minutes when both are present, short = false', () => {
    const result = getReadableTimeHMS(3660); // 1h 1m
    expect(result).toBe('1 hours 1 minutes');
  });

  it('returns hours and minutes when both are present, short = true', () => {
    const result = getReadableTimeHMS(7260, true); // 2h 1m
    expect(result).toBe('2h 1m');
  });

  it('trims extra whitespace when only one part is present', () => {
    const result = getReadableTimeHMS(3600); // only hours
    expect(result).toBe('1 hours');
  });
});

describe('getTimeHHmmFromDate', () => {
  it('formats time correctly for single-digit hours and minutes', () => {
    const date = new Date(2024, 6, 1, 7, 5); // 07:05
    const result = getTimeHHmmFromDate(date);
    expect(result).toBe('07:05');
  });

  it('formats time correctly for double-digit hours and minutes', () => {
    const date = new Date(2024, 6, 1, 12, 45); // 12:45
    const result = getTimeHHmmFromDate(date);
    expect(result).toBe('12:45');
  });

  it('formats 00:00 correctly for midnight', () => {
    const date = new Date(2024, 6, 1, 0, 0); // 00:00
    const result = getTimeHHmmFromDate(date);
    expect(result).toBe('00:00');
  });

  it('formats 23:59 correctly for end of day', () => {
    const date = new Date(2024, 6, 1, 23, 59); // 23:59
    const result = getTimeHHmmFromDate(date);
    expect(result).toBe('23:59');
  });

  it('pads only minutes if needed', () => {
    const date = new Date(2024, 6, 1, 10, 4); // 10:04
    const result = getTimeHHmmFromDate(date);
    expect(result).toBe('10:04');
  });

  it('pads only hours if needed', () => {
    const date = new Date(2024, 6, 1, 5, 20); // 05:20
    const result = getTimeHHmmFromDate(date);
    expect(result).toBe('05:20');
  });
});
