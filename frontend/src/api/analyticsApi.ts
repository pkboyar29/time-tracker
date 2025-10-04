import axios from './axios';
import { getBarName, getBarDetailedName } from '../helpers/barNaming';

import { ITimeBar } from '../ts/interfaces/Statistics/ITimeBar';
import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';
import { ISessionStatistics } from '../ts/interfaces/Statistics/ISessionStatistics';

interface IAnalytics {
  sessionStatistics: ISessionStatistics;
  activityDistributionItems: IActivityDistribution[];
  timeBars: ITimeBar[];
}

const mapResponseData = (unmappedData: any): IAnalytics => {
  // TODO: можно установить исключения для нескольких цветов, которые есть в самом интерфейсе
  const activityFillMap = new Map();
  unmappedData.activityDistribution.forEach((unmappedAd: any) => {
    activityFillMap.set(
      unmappedAd.activityName,
      '#' +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, '0')
    );
  });

  const activityDistributionItems = unmappedData.activityDistribution.map(
    (unmappedAd: any) => {
      return {
        activityName: unmappedAd.activityName,
        sessionsAmount: unmappedAd.sessionsAmount,
        spentTimeSeconds: unmappedAd.spentTimeSeconds,
        spentTimePercentage: parseFloat(
          (unmappedAd.spentTimeSeconds / unmappedData.spentTimeSeconds).toFixed(
            2
          )
        ),
        fill: activityFillMap.get(unmappedAd.activityName),
      };
    }
  );

  return {
    sessionStatistics: {
      sessionsAmount: unmappedData.sessionsAmount,
      spentTimeSeconds: unmappedData.spentTimeSeconds,
    },
    activityDistributionItems,
    timeBars: unmappedData.timeBars.map((unmappedBar: any) => ({
      startOfRange: new Date(unmappedBar.startOfRange),
      endOfRange: new Date(unmappedBar.endOfRange),
      sessionsAmount: unmappedBar.sessionsAmount,
      spentTimeSeconds: unmappedBar.spentTimeSeconds,
      barName: getBarName(unmappedBar),
      barDetailedName: getBarDetailedName(unmappedBar),
      activityDistributionItems: unmappedBar.activityDistribution.map(
        (unmappedAd: any) => {
          return {
            activityName: unmappedAd.activityName,
            sessionsAmount: unmappedAd.sessionsAmount,
            spentTimeSeconds: unmappedAd.spentTimeSeconds,
            spentTimePercentage: parseFloat(
              (
                unmappedAd.spentTimeSeconds / unmappedData.spentTimeSeconds
              ).toFixed(2)
            ),
            fill: activityFillMap.get(unmappedAd.activityName),
          };
        }
      ),
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
