export const getRemainingTimeHoursMinutesSeconds = (
  totalTimeSeconds: number,
  spentTimeSeconds: number
): string => {
  const remainingSeconds = totalTimeSeconds - spentTimeSeconds;
  const hours: number = Math.trunc(remainingSeconds / 3600);
  const formattedHours: string = hours !== 0 ? `${hours.toString()}:` : '';
  const minutes: number = Math.trunc(remainingSeconds / 60) - hours * 60;
  const formattedMinutes: string =
    minutes < 10 ? '0' + minutes : minutes.toString();
  const seconds: number = remainingSeconds % 60;
  const formattedSeconds: string =
    seconds < 10 ? '0' + (seconds % 60) : (seconds % 60).toString();

  return `${formattedHours}${formattedMinutes}:${formattedSeconds}`;
};

export const getTimeHoursMinutesSeconds = (allSeconds: number): string => {
  const hours: number = Math.trunc(allSeconds / 3600);
  const formattedHours: string = hours < 10 ? '0' + hours : hours.toString();
  const minutes: number = Math.trunc(allSeconds / 60);
  const formattedMinutes: string =
    minutes < 10 ? '0' + minutes : minutes.toString();
  const seconds: number = allSeconds % 60;
  const formattedSeconds: string =
    seconds < 10 ? '0' + (seconds % 60) : (seconds % 60).toString();

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
};
