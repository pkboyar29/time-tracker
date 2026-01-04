import axios from './axios';
import { getBarName, getBarDetailedName } from '../helpers/barNaming';
import { getRandomBrightColor } from '../helpers/colorHelpers';
import i18n from 'i18next';

import { ITimeBar } from '../ts/interfaces/Statistics/ITimeBar';
import { IAnalytics } from '../ts/interfaces/Statistics/IAnaltytics';
import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';

const mapResponseData = (unmappedData: any): IAnalytics => {
  const activityFillMap = new Map();
  unmappedData.activityDistribution.forEach((unmappedAd: any) => {
    activityFillMap.set(unmappedAd.activityName, getRandomBrightColor());
  });

  const activityDistributionItems: IActivityDistribution[] =
    unmappedData.activityDistribution.map((ad: any) => {
      return {
        activityName: ad.activityName,
        sessionStatistics: ad.sessionStatistics,
        spentTimePercentage: parseFloat(
          (
            ad.sessionStatistics.spentTimeSeconds /
            unmappedData.sessionStatistics.spentTimeSeconds
          ).toFixed(2)
        ),
        fill: activityFillMap.get(ad.activityName),
      };
    });

  const timeBars: ITimeBar[] = unmappedData.timeBars.map((bar: any) => {
    const startOfRange = new Date(bar.startOfRange);
    const endOfRange = new Date(bar.endOfRange);

    return {
      startOfRange,
      endOfRange,
      barName: getBarName(startOfRange, endOfRange, i18n.t),
      barDetailedName: getBarDetailedName(
        startOfRange,
        endOfRange,
        i18n.t,
        i18n.language
      ),
      sessionStatistics: bar.sessionStatistics,
      adItems: bar.activityDistribution.map((ad: any) => {
        return {
          activityName: ad.activityName,
          sessionStatistics: ad.sessionStatistics,
          spentTimePercentage: parseFloat(
            (
              ad.sessionStatistics.spentTimeSeconds /
              unmappedData.sessionStatistics.spentTimeSeconds
            ).toFixed(2)
          ),
          fill: activityFillMap.get(ad.activityName),
        };
      }),
    };
  });

  return {
    sessionStatistics: unmappedData.sessionStatistics,
    adItems: activityDistributionItems,
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
