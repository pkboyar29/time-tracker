import { TFunction } from 'i18next';
import {
  getRangeType,
  getMonthName,
  getMonthDetailedName,
  formatDate,
} from '../helpers/dateHelpers';
import { getTimeHHmmFromDate } from '../helpers/timeHelpers';

export const getBarName = (
  startOfRange: Date,
  endOfRange: Date,
  t: TFunction
): string => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const ONE_HOUR_MS = 60 * 60 * 1000;

  if (endOfRange.getTime() - startOfRange.getTime() < ONE_HOUR_MS) {
    // if there is less than one hour in range
    return `${startOfRange.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })} - ${endOfRange.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } else if (endOfRange.getTime() - startOfRange.getTime() == ONE_HOUR_MS) {
    // if it's exactly one hour
    return startOfRange.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (endOfRange.getTime() - startOfRange.getTime() < ONE_DAY_MS - 1) {
    // if there is less than one day in range
    return `${startOfRange.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })} - ${endOfRange.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } else if (getRangeType(startOfRange, endOfRange) == 'days') {
    // if it's exactly one day
    return startOfRange.getDate().toString();
  } else if (
    endOfRange.getTime() - startOfRange.getTime() > ONE_DAY_MS - 1 &&
    getRangeType(startOfRange, endOfRange) != 'months'
  ) {
    // if there is more than one day in range but it's not exactly one month
    return `${getMonthName(
      startOfRange.getMonth(),
      t
    )} ${startOfRange.getDate()} - ${getMonthName(
      endOfRange.getMonth(),
      t
    )} ${endOfRange.getDate()}`;
  } else if (getRangeType(startOfRange, endOfRange) == 'months') {
    // if it's exactly one month
    return getMonthName(startOfRange.getMonth(), t);
  }

  return '';
};

export const getBarDetailedName = (
  startOfRange: Date,
  endOfRange: Date,
  t: TFunction,
  i18nLang: string
) => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  if (getRangeType(startOfRange, endOfRange) == 'days') {
    return formatDate(startOfRange, i18nLang, { withWeekDay: true });
    // if there is less than one day in range
  } else if (endOfRange.getTime() - startOfRange.getTime() < ONE_DAY_MS - 1) {
    return `${formatDate(startOfRange, i18nLang)} ${getTimeHHmmFromDate(
      startOfRange
    )} - ${getTimeHHmmFromDate(endOfRange)}`;
  } else if (getRangeType(startOfRange, endOfRange) == 'months') {
    return `${getMonthDetailedName(
      startOfRange.getMonth(),
      t
    )} ${startOfRange.getFullYear()}`;
    // if there is more than one day in range
  } else if (endOfRange.getTime() - startOfRange.getTime() > ONE_DAY_MS - 1) {
    return `${getMonthName(
      startOfRange.getMonth(),
      t
    )} ${startOfRange.getDate()} ${getTimeHHmmFromDate(
      startOfRange
    )} - ${getMonthName(
      endOfRange.getMonth(),
      t
    )} ${endOfRange.getDate()} ${getTimeHHmmFromDate(endOfRange)}`;
  }

  return '';
};
