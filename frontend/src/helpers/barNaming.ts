import {
  getRangeType,
  getMonthName,
  getMonthDetailedName,
} from '../helpers/dateHelpers';
import { getTimeHHmmFromDate } from '../helpers/timeHelpers';

export const getBarName = (unmappedBar: any): string => {
  const startOfRange: Date = new Date(unmappedBar.startOfRange);
  const endOfRange: Date = new Date(unmappedBar.endOfRange);

  if (getRangeType(startOfRange, endOfRange) == 'days') {
    return startOfRange.getDate().toString();
    // if there is less than one day in range
  } else if (endOfRange.getTime() - startOfRange.getTime() < 86400000 - 1) {
    return startOfRange.getDate().toString();
  } else if (getRangeType(startOfRange, endOfRange) == 'months') {
    return getMonthName(startOfRange.getMonth());
    // if there is more than one day in range
  } else if (endOfRange.getTime() - startOfRange.getTime() > 86400000 - 1) {
    return `${getMonthName(
      startOfRange.getMonth()
    )} ${startOfRange.getDate()} - ${getMonthName(
      endOfRange.getMonth()
    )} ${endOfRange.getDate()}`;
  }

  return '';
};

export const getBarDetailedName = (unmappedBar: any) => {
  const startOfRange: Date = new Date(unmappedBar.startOfRange);
  const endOfRange: Date = new Date(unmappedBar.endOfRange);

  if (getRangeType(startOfRange, endOfRange) == 'days') {
    return startOfRange.toDateString();
    // if there is less than one day in range
  } else if (endOfRange.getTime() - startOfRange.getTime() < 86400000 - 1) {
    return `${startOfRange.toDateString()} ${getTimeHHmmFromDate(
      startOfRange
    )} - ${getTimeHHmmFromDate(endOfRange)}`;
  } else if (getRangeType(startOfRange, endOfRange) == 'months') {
    return getMonthDetailedName(startOfRange);
    // if there is more than one day in range
  } else if (endOfRange.getTime() - startOfRange.getTime() > 86400000 - 1) {
    return `${getMonthName(
      startOfRange.getMonth()
    )} ${startOfRange.getDate()} ${getTimeHHmmFromDate(
      startOfRange
    )} - ${getMonthName(
      endOfRange.getMonth()
    )} ${endOfRange.getDate()} ${getTimeHHmmFromDate(endOfRange)}`;
  }

  return '';
};
