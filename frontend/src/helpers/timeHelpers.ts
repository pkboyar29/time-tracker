import { TFunction } from 'i18next';

export const getRemainingTimeHoursMinutesSeconds = (
  totalTimeSeconds: number,
  spentTimeSeconds: number,
  short: boolean = false
): string => {
  const remainingSeconds = totalTimeSeconds - spentTimeSeconds;

  const hours: number = Math.trunc(remainingSeconds / 3600);
  const formattedHours: string =
    hours < 10 ? `0${hours.toString()}` : `${hours.toString()}`;

  const minutes: number = Math.trunc(remainingSeconds / 60) - hours * 60;
  const formattedMinutes: string =
    minutes < 10 ? '0' + minutes : minutes.toString();

  const seconds: number = remainingSeconds % 60;
  const formattedSeconds: string =
    seconds < 10 ? '0' + (seconds % 60) : (seconds % 60).toString();

  if (spentTimeSeconds > totalTimeSeconds) {
    return '00:00';
  }

  if (short == true && formattedHours === '00') {
    return `${formattedMinutes}:${formattedSeconds}`;
  }

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
};

export const getTimeHMS = (allSeconds: number): string => {
  const hours: number = Math.trunc(allSeconds / 3600);
  const formattedHours: string = hours < 10 ? '0' + hours : hours.toString();
  const minutes: number = Math.trunc(allSeconds / 60) - hours * 60;
  const formattedMinutes: string =
    minutes < 10 ? '0' + minutes : minutes.toString();
  const seconds: number = allSeconds % 60;
  const formattedSeconds: string =
    seconds < 10 ? '0' + (seconds % 60) : (seconds % 60).toString();

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
};

export const getTimeParts = (seconds: number) => {
  const hours = Math.trunc(seconds / 3600);
  const minutes = Math.trunc((seconds % 3600) / 60);
  const secs = Math.trunc(seconds % 60);

  return { hours, minutes, seconds: secs };
};

export const getReadableTime = (
  seconds: number,
  t: TFunction,
  options: { short: boolean; zeroUnits?: boolean }
): string => {
  const { short, zeroUnits = false } = options;
  const { hours, minutes, seconds: secs } = getTimeParts(seconds);

  const parts: string[] = [];

  if (hours > 0 || zeroUnits) {
    parts.push(
      short
        ? t('time.hoursShort', { count: hours })
        : t('time.hours', { count: hours })
    );
  }

  if (minutes > 0 || zeroUnits) {
    parts.push(
      short
        ? t('time.minutesShort', { count: minutes })
        : t('time.minutes', { count: minutes })
    );
  }

  if (parts.length === 0) {
    parts.push(
      short
        ? t('time.secondsShort', { count: secs })
        : t('time.seconds', { count: secs })
    );
  }

  return parts.join(' ');
};

export const getTimeHHmmFromDate = (date: Date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${hours < 10 ? `0${hours}` : `${hours}`}:${
    minutes < 10 ? `0${minutes}` : `${minutes}`
  }`;
};

export const getTimerEndDate = (
  startTimerTimestamp: number,
  startTimerSpentSeconds: number,
  sessionTotalSeconds: number
): Date => {
  return new Date(
    startTimerTimestamp + (sessionTotalSeconds - startTimerSpentSeconds) * 1000
  );
};
