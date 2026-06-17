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
  t: TFunction,
): string => {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const ONE_DAY_MS = 24 * ONE_HOUR_MS;

  const rangeDurationMs = endOfRange.getTime() - startOfRange.getTime();
  const rangeType = getRangeType(startOfRange, endOfRange);

  if (rangeDurationMs < ONE_HOUR_MS) {
    // if there's less than one hour
    return `${startOfRange.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })} - ${endOfRange.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } else if (rangeDurationMs === ONE_HOUR_MS) {
    // if it's exactly one hour
    return startOfRange.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (rangeDurationMs < ONE_DAY_MS - 1) {
    // if there's less than one day
    return `${startOfRange.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })} - ${endOfRange.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } else if (rangeType === 'days') {
    // if it's exactly one day
    return startOfRange.getDate().toString();
  } else if (rangeDurationMs > ONE_DAY_MS - 1 && rangeType !== 'months') {
    // if there's more than one day and not exactly one month
    const startMonthName = getMonthName(startOfRange.getMonth(), t);
    const endMonthName = getMonthName(endOfRange.getMonth(), t);

    return `${startMonthName} ${startOfRange.getDate()} - ${endMonthName} ${endOfRange.getDate()}`;
  } else if (rangeType === 'months') {
    // if it's exactly one month
    return getMonthName(startOfRange.getMonth(), t);
  }

  return '';
};

export const getBarDetailedName = (
  startOfRange: Date,
  endOfRange: Date,
  t: TFunction,
  i18nLang: string,
) => {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const ONE_DAY_MS = 24 * ONE_HOUR_MS;

  const rangeDurationMs = endOfRange.getTime() - startOfRange.getTime();
  const rangeType = getRangeType(startOfRange, endOfRange);

  if (rangeType === 'days') {
    return formatDate(startOfRange, i18nLang, { withWeekDay: true });
    // if there is less than one day in range
  } else if (rangeDurationMs < ONE_DAY_MS - 1) {
    return `${formatDate(startOfRange, i18nLang)} ${getTimeHHmmFromDate(
      startOfRange,
    )} - ${getTimeHHmmFromDate(endOfRange)}`;
  } else if (rangeType === 'months') {
    return `${getMonthDetailedName(
      startOfRange.getMonth(),
      t,
    )} ${startOfRange.getFullYear()}`;
    // if there is more than one day in range
  } else if (rangeDurationMs > ONE_DAY_MS - 1) {
    const startMonthName = getMonthName(startOfRange.getMonth(), t);
    const endMonthName = getMonthName(endOfRange.getMonth(), t);

    return `${startMonthName} ${startOfRange.getDate()} ${getTimeHHmmFromDate(
      startOfRange,
    )} - ${endMonthName} ${endOfRange.getDate()} ${getTimeHHmmFromDate(endOfRange)}`;
  }

  return '';
};
