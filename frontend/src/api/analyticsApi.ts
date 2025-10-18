import axios from './axios';
import { getBarName, getBarDetailedName } from '../helpers/barNaming';

import { ITimeBar } from '../ts/interfaces/Statistics/ITimeBar';
import { IAnalytics } from '../ts/interfaces/Statistics/IAnaltytics';

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

  const timeBars: ITimeBar[] = unmappedData.timeBars.map(
    (unmappedBar: any) => ({
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
    })
  );

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
      sessionsAmount: unmappedData.sessionsAmount,
      spentTimeSeconds: unmappedData.spentTimeSeconds,
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
