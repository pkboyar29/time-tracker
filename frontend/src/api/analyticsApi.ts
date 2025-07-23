import axios from './axios';
import {
  getRangeType,
  getMonthName,
  getMonthDetailedName,
} from '../helpers/dateHelpers';
import { getTimeHHmmFromDate } from '../helpers/timeHelpers';

import { ITimeBar } from '../ts/interfaces/Statistics/ITimeBar';
import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';
import { ISessionStatistics } from '../ts/interfaces/Statistics/ISessionStatistics';

interface IAnalytics {
  sessionStatistics: ISessionStatistics;
  activityDistributionItems: IActivityDistribution[];
  timeBars: ITimeBar[];
}

const getBarName = (unmappedBar: any): string => {
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

const getBarDetailedName = (unmappedBar: any) => {
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

const mapResponseData = (unmappedData: any): IAnalytics => {
  return {
    sessionStatistics: {
      sessionsAmount: unmappedData.sessionsAmount,
      spentTimeSeconds: unmappedData.spentTimeSeconds,
    },
    activityDistributionItems: unmappedData.activityDistribution.map(
      (unmappedDistr: any) => {
        return {
          activityName: unmappedDistr.activityName,
          activityGroup: unmappedDistr.activityGroup,
          sessionsAmount: unmappedDistr.sessionsAmount,
          spentTimeSeconds: unmappedDistr.spentTimeSeconds,
          spentTimePercentage: parseFloat(
            (
              unmappedDistr.spentTimeSeconds / unmappedData.spentTimeSeconds
            ).toFixed(2)
          ),
        };
      }
    ),
    timeBars: unmappedData.timeBars.map((unmappedBar: any) => ({
      startOfRange: new Date(unmappedBar.startOfRange),
      endOfRange: new Date(unmappedBar.endOfRange),
      sessionsAmount: unmappedBar.sessionsAmount,
      spentTimeSeconds: unmappedBar.spentTimeSeconds,
      barName: getBarName(unmappedBar),
      barDetailedName: getBarDetailedName(unmappedBar),
    })),
  };
};

export const fetchOverallAnalytics = async (): Promise<IAnalytics> => {
  const { data } = await axios.get(
    `/analytics/?from=2000-01-01T00:00:00&to=${new Date(
      Date.now()
    ).toISOString()}&tz=${Intl.DateTimeFormat().resolvedOptions().timeZone}`
  );

  return mapResponseData(data);
};

export const fetchRangeAnalytics = async (fromDate: Date, toDate: Date) => {
  const { data } = await axios.get(
    `/analytics/?from=${fromDate.toISOString()}&to=${toDate.toISOString()}&tz=${
      Intl.DateTimeFormat().resolvedOptions().timeZone
    }`
  );

  return mapResponseData(data);
};
