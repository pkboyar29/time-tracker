import { TFunction } from 'i18next';
import { getBarName, getBarDetailedName } from './barNaming';
import i18n from 'i18next';

import { ITimeBar } from '../ts/interfaces/Statistics/ITimeBar';
import { ISessionStat } from '../ts/interfaces/Statistics/ISessionStat';
import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';

export const mergeSessionStat = (
  statisticsList: ISessionStat[],
): ISessionStat => {
  const sessionsAmount = statisticsList.reduce(
    (amount, statistics) => amount + statistics.sessionsAmount,
    0,
  );
  const spentTimeSeconds = statisticsList.reduce(
    (seconds, statistics) => seconds + statistics.spentTimeSeconds,
    0,
  );
  const pausedAmount = statisticsList.reduce(
    (amount, statistics) => amount + statistics.pausedAmount,
    0,
  );

  return {
    sessionsAmount,
    spentTimeSeconds,
    pausedAmount,
  };
};

export const mergeActivityDistributions = (
  adsList: IActivityDistribution[][],
): IActivityDistribution[] => {
  if (adsList.length == 0) {
    return [];
  }
  if (adsList.length == 1) {
    return adsList[0];
  }

  let finalAd: IActivityDistribution[] = adsList[0];

  for (let i = 1; i < adsList.length; i++) {
    finalAd = finalAd.map((ad) => {
      for (let j = 0; j < adsList[i].length; j++) {
        if (ad.name === adsList[i][j].name) {
          const { id: activityId, sessionStat, fill } = adsList[i][j];
          adsList[i] = adsList[i].filter((ad) => ad.id !== activityId);

          return {
            id: ad.id,
            name: ad.name,
            sessionStat: mergeSessionStat([ad.sessionStat, sessionStat]),
            spentTimePercentage: 0,
            fill,
          };
        }
      }

      return ad;
    });

    finalAd = finalAd.concat(adsList[i]);
  }

  const totalSpentTimeSeconds = finalAd.reduce(
    (seconds, ad) => seconds + ad.sessionStat.spentTimeSeconds,
    0,
  );
  finalAd = finalAd.map((ad) => ({
    ...ad,
    spentTimePercentage: parseFloat(
      (ad.sessionStat.spentTimeSeconds / totalSpentTimeSeconds).toFixed(2),
    ),
  }));

  return finalAd;
};

export const splitTimeBars = (
  timeBars: ITimeBar[],
  parts: number,
  t: TFunction,
): ITimeBar[] => {
  if (!Number.isInteger(parts) || parts < 1) {
    throw new Error(`parts must be a positive integer, got ${parts}`);
  }
  if (timeBars.length == 0) {
    return [];
  }
  if (parts > timeBars.length) {
    throw new Error('parts must be less or equal to timeBars length');
  }

  const timeBarsCopy = [...timeBars];
  const partSize = Math.ceil(timeBars.length / parts);

  const aggregatedTimeBars: ITimeBar[] = [];
  for (let i = 0; i < parts; i++) {
    const timeBarsPart = timeBarsCopy.splice(0, partSize);

    const startOfRange = timeBarsPart[0].startOfRange;
    const endOfRange = timeBarsPart[timeBarsPart.length - 1].endOfRange;

    const aggregatedTimeBar: ITimeBar = {
      startOfRange,
      endOfRange,
      barName: getBarName(startOfRange, endOfRange, t),
      barDetailedName: getBarDetailedName(
        startOfRange,
        endOfRange,
        t,
        i18n.language,
      ),
      sessionStat: mergeSessionStat([
        ...timeBarsPart.map((bar) => bar.sessionStat),
      ]),
      adItems: mergeActivityDistributions([
        ...timeBarsPart.map((bar) => bar.adItems),
      ]),
    };
    aggregatedTimeBars.push(aggregatedTimeBar);
  }

  return aggregatedTimeBars;
};
