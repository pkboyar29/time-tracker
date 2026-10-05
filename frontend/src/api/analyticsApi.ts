import axios from './axios';
import { getBarName, getBarDetailedName } from '../helpers/barNaming';
import i18n from 'i18next';

import { ITimeBar } from '../ts/interfaces/Statistics/ITimeBar';
import { IAnalytics } from '../ts/interfaces/Statistics/IAnaltytics';
import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';
import { ISessionStat } from '../ts/interfaces/Statistics/ISessionStat';

const mapResponseData = (unmappedData: any): IAnalytics => {
  // TODO: remove
  const sessionStat: ISessionStat = {
    ...unmappedData.sessionStat,
    spentSeconds: unmappedData.sessionStat.spentTimeSeconds,
  };

  const adItems: IActivityDistribution[] = unmappedData.activityDistribution.map((ad: any) => ({
    id: ad.id,
    name: ad.name,
    fill: ad.color,
    // TODO: remove
    sessionStat: {
      ...ad.sessionStat,
      spentSeconds: ad.sessionStat.spentTimeSeconds,
    },
    spentTimePercentage: parseFloat(
      (ad.sessionStat.spentTimeSeconds / sessionStat.spentSeconds).toFixed(2),
    ),
  }));

  const overallParam = new URLSearchParams(window.location.search).get('overall');
  const overallMode = typeof overallParam === 'string' ? true : false;

  const timeBars: ITimeBar[] = unmappedData.timeBars.map((bar: any) => {
    const startOfRange = new Date(bar.startOfRange);
    const endOfRange = new Date(bar.endOfRange);

    const barAds = bar.activityDistribution.map((ad: any) => {
      return {
        id: ad.id,
        name: ad.name,
        fill: ad.color,
        // TODO: remove
        sessionStat: {
          ...ad.sessionStat,
          spentSeconds: ad.sessionStat.spentTimeSeconds,
        },
        spentTimePercentage: parseFloat(
          (ad.sessionStat.spentTimeSeconds / sessionStat.spentSeconds).toFixed(2),
        ),
      };
    });

    return {
      startOfRange,
      endOfRange,
      barName: overallMode
        ? startOfRange.getFullYear().toString()
        : getBarName(startOfRange, endOfRange, i18n.t),
      barDetailedName: getBarDetailedName(startOfRange, endOfRange, i18n.t, i18n.language),
      // TODO: remove
      sessionStat: { ...bar.sessionStat, spentSeconds: bar.sessionStat.spentTimeSeconds },
      adItems: barAds,
    };
  });

  return {
    sessionStat,
    adItems,
    timeBars,
  };
};

export const fetchRangeAnalytics = async (fromDate: Date, toDate: Date) => {
  const { data } = await axios.get(
    `/analytics/?from=${fromDate.toISOString()}&to=${toDate.toISOString()}`,
  );

  return mapResponseData(data);
};
