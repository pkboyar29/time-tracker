import { TFunction } from 'i18next';
import {
  getRemainingTimeHoursMinutesSeconds,
  getTimeHMS,
  getTimeParts,
  getReadableTime,
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

describe('getTimeParts', () => {
  it('returns 1 hour, 0 minutes and 0 seconds for 3600 seconds', () => {
    const parts = getTimeParts(3600);
    expect(parts.hours).toBe(1);
    expect(parts.minutes).toBe(0);
    expect(parts.seconds).toBe(0);
  });

  it('returns 0 hours, 1 minute and 5 seconds for 65 seconds', () => {
    const parts = getTimeParts(65);
    expect(parts.hours).toBe(0);
    expect(parts.minutes).toBe(1);
    expect(parts.seconds).toBe(5);
  });

  it('returns 0 hours, 0 minutes and 20 seconds for 20 seconds', () => {
    const parts = getTimeParts(20);
    expect(parts.hours).toBe(0);
    expect(parts.minutes).toBe(0);
    expect(parts.seconds).toBe(20);
  });
});

describe('getReadableTime', () => {
  const tEnMock = (key: string, opts: any) => {
    const dict: Record<string, string> = {
      'time.hours': `${opts.count} hours`,
      'time.minutes': `${opts.count} minutes`,
      'time.seconds': `${opts.count} seconds`,
      'time.hoursShort': `${opts.count}h`,
      'time.minutesShort': `${opts.count}m`,
      'time.secondsShort': `${opts.count}s`,
    };

    return dict[key];
  };

  it('formats hours and minutes in full format', () => {
    const result = getReadableTime(3800, tEnMock as TFunction, {
      short: false,
    });
    expect(result).toBe('1 hours 3 minutes');
  });

  it('formats hours and minutes in short format', () => {
    const result = getReadableTime(3800, tEnMock as TFunction, { short: true });
    expect(result).toBe('1h 3m');
  });

  it('formats seconds only in full format when less than a minute', () => {
    const result = getReadableTime(50, tEnMock as TFunction, { short: false });
    expect(result).toBe('50 seconds');
  });

  it('formats seconds only in short format when less than a minute', () => {
    const result = getReadableTime(50, tEnMock as TFunction, { short: true });
    expect(result).toBe('50s');
  });

  it('includes zero hours when zeroUnits is enabled in full format', () => {
    const result = getReadableTime(3590, tEnMock as TFunction, {
      short: false,
      zeroUnits: true,
    });
    expect(result).toBe('0 hours 59 minutes');
  });

  it('includes zero hours when zeroUnits is enabled in short format', () => {
    const result = getReadableTime(3590, tEnMock as TFunction, {
      short: true,
      zeroUnits: true,
    });
    expect(result).toBe('0h 59m');
  });

  it('includes zero minutes when zeroUnits is enabled in full format', () => {
    const result = getReadableTime(3610, tEnMock as TFunction, {
      short: false,
      zeroUnits: true,
    });
    expect(result).toBe('1 hours 0 minutes');
  });

  it('includes zero minutes when zeroUnits is enabled in short format', () => {
    const result = getReadableTime(3610, tEnMock as TFunction, {
      short: true,
      zeroUnits: true,
    });
    expect(result).toBe('1h 0m');
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
