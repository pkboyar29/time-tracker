import { TFunction } from 'i18next';
import {
  getRangeType,
  getMonthName,
  getMonthDetailedName,
  formatDate,
} from '../helpers/dateHelpers';
import { getTimeHHmmFromDate } from '../helpers/timeHelpers';

export const getBarName = (unmappedBar: any, t: TFunction): string => {
  const startOfRange: Date = new Date(unmappedBar.startOfRange);
  const endOfRange: Date = new Date(unmappedBar.endOfRange);

  if (getRangeType(startOfRange, endOfRange) == 'days') {
    return startOfRange.getDate().toString();
  } else if (endOfRange.getTime() - startOfRange.getTime() <= 3_600_000) {
    // if there is less than one hour in range
    return startOfRange.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (endOfRange.getTime() - startOfRange.getTime() < 86_400_000 - 1) {
    // if there is less than one day in range
    return startOfRange.getDate().toString();
  } else if (getRangeType(startOfRange, endOfRange) == 'months') {
    return getMonthName(startOfRange.getMonth(), t);
  } else if (endOfRange.getTime() - startOfRange.getTime() > 86_400_000 - 1) {
    // if there is more than one day in range
    return `${getMonthName(
      startOfRange.getMonth(),
      t
    )} ${startOfRange.getDate()} - ${getMonthName(
      endOfRange.getMonth(),
      t
    )} ${endOfRange.getDate()}`;
  }

  return '';
};

export const getBarDetailedName = (
  unmappedBar: any,
  t: TFunction,
  i18nLang: string
) => {
  const startOfRange: Date = new Date(unmappedBar.startOfRange);
  const endOfRange: Date = new Date(unmappedBar.endOfRange);

  if (getRangeType(startOfRange, endOfRange) == 'days') {
    return formatDate(startOfRange, i18nLang);
    // if there is less than one day in range
  } else if (endOfRange.getTime() - startOfRange.getTime() < 86400000 - 1) {
    return `${formatDate(startOfRange, i18nLang)} ${getTimeHHmmFromDate(
      startOfRange
    )} - ${getTimeHHmmFromDate(endOfRange)}`;
  } else if (getRangeType(startOfRange, endOfRange) == 'months') {
    return `${getMonthDetailedName(
      startOfRange.getMonth(),
      t
    )} ${startOfRange.getFullYear()}`;
    // if there is more than one day in range
  } else if (endOfRange.getTime() - startOfRange.getTime() > 86400000 - 1) {
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
