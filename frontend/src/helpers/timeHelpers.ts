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

export const getReadableTimeHMS = (
  seconds: number,
  short: boolean = false,
  zeroUnits: boolean = false
): string => {
  const hours: number = Math.trunc(seconds / 3600);

  let hoursString = '';
  if (hours === 0) {
    if (zeroUnits) {
      hoursString = short ? '0h' : '0 hours';
    }
  } else {
    hoursString = short ? `${hours}h` : `${hours} hours`;
  }

  const remainingSeconds: number = seconds - hours * 3600;
  const remainingMinutes: number = Math.trunc(remainingSeconds / 60);

  let minutesString = '';
  if (remainingMinutes === 0) {
    if (zeroUnits) {
      minutesString = short ? '0m' : '0 minutes';
    }
  } else {
    minutesString = short
      ? `${remainingMinutes}m`
      : `${remainingMinutes} minutes`;
  }

  const resultString =
    hoursString === '' && minutesString === ''
      ? `${
          short == true
            ? `${Math.trunc(seconds)}s`
            : `${Math.trunc(seconds)} seconds`
        }`
      : `${hoursString} ${minutesString}`;

  return resultString.trim();
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
