import axios from './axios';

import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';
import { ISessionStatistics } from '../ts/interfaces/Statistics/ISessionStatistics';

interface IAnalytics {
  sessionStatistics: ISessionStatistics;
  activityDistributionItems: IActivityDistribution[];
}

const mapResponseData = (unmappedData: any): IAnalytics => {
  return {
    sessionStatistics: {
      sessionsAmount: unmappedData.sessionsAmount,
      spentTimeSeconds: unmappedData.spentTimeSeconds,
    },
    activityDistributionItems: unmappedData.activityDistribution,
  };
};

export const fetchOverallAnalytics = async (): Promise<IAnalytics> => {
  const { data } = await axios.get(
    `/analytics/?from=2000-01-01T00:00:00&to=${new Date(
      Date.now()
    ).toISOString()}`
  );

  return mapResponseData(data);
};

export const fetchRangeAnalytics = async (fromDate: Date, toDate: Date) => {
  const { data } = await axios.get(
    `/analytics/?from=${fromDate.toISOString()}&to=${toDate.toISOString()}`
  );

  return mapResponseData(data);
};
