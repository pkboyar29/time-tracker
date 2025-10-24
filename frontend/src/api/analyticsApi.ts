import axios from './axios';
import { getBarName, getBarDetailedName } from '../helpers/barNaming';

import { ITimeBar } from '../ts/interfaces/Statistics/ITimeBar';
import { IAnalytics } from '../ts/interfaces/Statistics/IAnaltytics';
import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';

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

  const activityDistributionItems: IActivityDistribution[] =
    unmappedData.activityDistribution.map((ad: any) => {
      return {
        activityName: ad.activityName,
        sessionsAmount: ad.sessionStatistics.sessionsAmount,
        pausedAmount: ad.sessionStatistics.pausedAmount,
        spentTimeSeconds: ad.sessionStatistics.spentTimeSeconds,
        spentTimePercentage: parseFloat(
          (
            ad.sessionStatistics.spentTimeSeconds /
            unmappedData.sessionStatistics.spentTimeSeconds
          ).toFixed(2)
        ),
        fill: activityFillMap.get(ad.activityName),
      };
    });

  const timeBars: ITimeBar[] = unmappedData.timeBars.map((bar: any) => ({
    startOfRange: new Date(bar.startOfRange),
    endOfRange: new Date(bar.endOfRange),
    sessionsAmount: bar.sessionStatistics.sessionsAmount,
    pausedAmount: bar.sessionStatistics.pausedAmount,
    spentTimeSeconds: bar.sessionStatistics.spentTimeSeconds,
    barName: getBarName(bar),
    barDetailedName: getBarDetailedName(bar),
    activityDistributionItems: bar.activityDistribution.map((ad: any) => {
      return {
        activityName: ad.activityName,
        sessionsAmount: ad.sessionStatistics.sessionsAmount,
        pausedAmount: ad.sessionStatistics.pausedAmount,
        spentTimeSeconds: ad.sessionStatistics.spentTimeSeconds,
        spentTimePercentage: parseFloat(
          (
            ad.sessionStatistics.spentTimeSeconds /
            unmappedData.sessionStatistics.spentTimeSeconds
          ).toFixed(2)
        ),
        fill: activityFillMap.get(ad.activityName),
      };
    }),
  }));

  let averageSpentTimeSeconds = 0;
  if (timeBars.length > 0) {
    const allSpentTimeSeconds = timeBars.reduce(
      (spentTimeSeconds, bar) => spentTimeSeconds + bar.spentTimeSeconds,
      0
    );

    let timerBarsLength = 0;
    for (let i = 0; i < timeBars.length; i++) {
      if (timeBars[i].startOfRange > new Date()) {
        timerBarsLength = i;
        break;
      }

      if (i == timeBars.length - 1) {
        timerBarsLength = timeBars.length;
      }
    }

    averageSpentTimeSeconds = allSpentTimeSeconds / timerBarsLength;
  }

  return {
    sessionStatistics: {
      sessionsAmount: unmappedData.sessionStatistics.sessionsAmount,
      spentTimeSeconds: unmappedData.sessionStatistics.spentTimeSeconds,
      pausedAmount: unmappedData.sessionStatistics.pausedAmount,
      averageSpentTimeSeconds,
    },
    activityDistributionItems,
    timeBars,
  };
};

export const fetchRangeAnalytics = async (fromDate: Date, toDate: Date) => {
  const { data } = await axios.get(
    `/analytics/?from=${fromDate.toISOString()}&to=${toDate.toISOString()}&tz=${
      Intl.DateTimeFormat().resolvedOptions().timeZone
    }`
  );

  return mapResponseData(data);
};
