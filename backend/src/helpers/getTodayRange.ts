import { DateTime } from 'luxon';

export const getTodayRange = (timezone: string) => {
  const startOfTodayLuxon = DateTime.fromJSDate(new Date(), {
    zone: timezone,
  }).startOf('day');
  const startOfToday = startOfTodayLuxon.toJSDate();
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  return {
    startOfToday,
    startOfTomorrow,
  };
};
