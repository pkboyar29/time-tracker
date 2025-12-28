import { FC, useRef, useMemo } from 'react';
import { getReadableTime } from '../helpers/timeHelpers';
import { PieChart, Pie, ResponsiveContainer, Tooltip } from 'recharts';
import { colors } from '../../design-tokens';
import { useTranslation } from 'react-i18next';

import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: number;
}

const CustomTooltip: FC<CustomTooltipProps> = ({ active, payload, label }) => {
  const isVisible = active && payload && payload.length;

  const adItem: IActivityDistribution = payload[0]?.payload;

  return (
    <div
      className="p-2.5 bg-surfaceLight dark:bg-surfaceDark rounded-sm border border-solid border-gray-300/80 max-w-[220px] break-words text-sm"
      style={{ visibility: isVisible ? 'visible' : 'hidden' }}
    >
      {isVisible && (
        <div>
          {adItem.activityName}{' '}
          <span className="text-gray-500 dark:text-gray-400">
            ({Math.trunc(adItem.spentTimePercentage * 100)}%)
          </span>
        </div>
      )}
    </div>
  );
};

interface ActivityDistributionBoxProps {
  adItems: IActivityDistribution[];
  adBoxMode: 'table' | 'chart';
  setAdBoxMode: (newAdMode: 'table' | 'chart') => void;
}

const ActivityDistributionBox: FC<ActivityDistributionBoxProps> = ({
  adItems,
  adBoxMode,
  setAdBoxMode,
}) => {
  const { t } = useTranslation();

  const rootRef = useRef<HTMLDivElement>(null);

  const sortedItems = useMemo(() => {
    return adItems.toSorted((a, b) => b.spentTimeSeconds - a.spentTimeSeconds);
  }, [adItems]);

  const pieItems = useMemo(() => {
    let pieItems = [...sortedItems];

    let lessOnePercentageCount = 0;
    pieItems.forEach((item) => {
      if (item.spentTimePercentage < 0.01) {
        lessOnePercentageCount += 1;
      }
    });

    if (lessOnePercentageCount >= 4) {
      let othersSpentTimeSeconds = 0;
      let othersSessionsAmount = 0;
      let othersPausedAmount = 0;
      let othersSpentTimePercentage = 0;

      for (let i = 1; i <= lessOnePercentageCount; i++) {
        const deletedLastItem = pieItems.pop();
        othersSessionsAmount += deletedLastItem
          ? deletedLastItem.sessionsAmount
          : 0;
        othersPausedAmount += deletedLastItem
          ? deletedLastItem.pausedAmount
          : 0;
        othersSpentTimeSeconds += deletedLastItem
          ? deletedLastItem.spentTimeSeconds
          : 0;
        othersSpentTimePercentage += deletedLastItem
          ? deletedLastItem.spentTimePercentage
          : 0;
      }

      pieItems = [
        ...pieItems,
        {
          activityName: t('adBox.others'),
          sessionsAmount: othersSessionsAmount,
          pausedAmount: othersPausedAmount,
          spentTimeSeconds: othersSpentTimeSeconds,
          spentTimePercentage: othersSpentTimePercentage,
          fill: '#4287f5',
        },
      ];
    }

    return pieItems;
  }, [sortedItems]);

  const onTableBarClick = () => {
    if (adBoxMode == 'chart') {
      setAdBoxMode('table');
    }

    rootRef.current?.scrollTo({
      left: 0,
      top: 0,
      behavior: 'smooth',
    });
  };

  const onChartBarClick = () => {
    if (adBoxMode == 'table') {
      setAdBoxMode('chart');
    }

    rootRef.current?.scrollTo({
      left: 0,
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div
      ref={rootRef}
      className="h-full overflow-y-auto border border-solid rounded-lg bg-surfaceLight dark:bg-surfaceDark border-gray-300/80 dark:border-gray-500"
    >
      <div className="sticky top-0 z-[39] flex flex-wrap-reverse gap-4 items-center justify-center min-[360px]:justify-between px-5 sm:px-10 pt-5 pb-4 border-b border-solid bg-surfaceLight dark:bg-surfaceDark border-gray-300/80 dark:border-gray-500">
        <div className="flex gap-2.5 text-[15px]">
          <button
            onClick={onTableBarClick}
            className={`transition duration-300 hover:text-primary dark:hover:text-primary ${
              adBoxMode == 'table'
                ? 'text-primary dark:text-primary'
                : 'dark:text-textDark'
            }`}
          >
            {t('adBox.table')}
          </button>
          <button
            onClick={onChartBarClick}
            className={`transition duration-300 hover:text-primary dark:hover:text-primary ${
              adBoxMode == 'chart'
                ? 'text-primary dark:text-primary'
                : 'dark:text-textDark'
            }`}
          >
            {t('adBox.chart')}
          </button>
        </div>

        <div className="inline-block px-4 py-1 mr-0 text-lg font-medium tracking-wide text-center text-gray-800 bg-gray-200 rounded-lg dark:bg-[rgba(255,255,255,0.05)] dark:text-textDark">
          {t('adBox.title')}
        </div>
      </div>

      {adBoxMode == 'table' && (
        <div className="overflow-x-auto scroll-overlay">
          <div className="min-w-[500px] px-5 sm:px-10 pb-5">
            <div className="flex my-3.5 text-lg tracking-wide text-gray-800 dark:text-textDarkSecondary">
              <div className="w-1/2">{t('adBox.activity')}</div>
              <div className="w-1/5">{t('adBox.sessions')}</div>
              <div className="w-1/5">{t('adBox.time')}</div>
              <div className="w-1/5">{t('adBox.distracted')}</div>
            </div>

            <div className="flex flex-col gap-3 dark:text-textDark">
              {sortedItems.map((item, index) => (
                <div className="flex items-center text-base" key={index}>
                  <div className="w-1/2 text-lg font-bold truncate">
                    {item.activityName}
                  </div>
                  <div className="w-1/5">{item.sessionsAmount}</div>
                  <div className="w-1/5">
                    {getReadableTime(item.spentTimeSeconds, t, {
                      short: true,
                    })}
                  </div>
                  <div className="w-1/5">
                    {t('plural.times', { count: item.pausedAmount })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {adBoxMode == 'chart' && (
        <div className="flex flex-col sm:flex-row justify-between px-5 sm:px-10 sm:my-3.5 pb-5">
          <div className="flex items-start self-center justify-center sm:pt-3 sm:sticky sm:self-start sm:w-1/2 top-10">
            <ResponsiveContainer minWidth={250} width="100%" height={300}>
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  animationDuration={750}
                  data={pieItems}
                  dataKey="spentTimeSeconds"
                  nameKey="activityName"
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  stroke={
                    localStorage.getItem('theme') === 'dark'
                      ? colors.surfaceDark
                      : '#fff'
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full sm:w-1/2 flex flex-col gap-2.5">
            {pieItems.map((item, index) => (
              <div className="flex items-center gap-2.5" key={index}>
                <div
                  style={{ backgroundColor: item.fill }}
                  className="w-12 h-3 rounded-lg shrink-0"
                />

                <div className="flex flex-col min-w-0">
                  <div className="text-lg truncate dark:text-textDark">
                    {item.activityName}
                  </div>
                  <div className="text-base text-gray-600 dark:text-textDarkSecondary">
                    (
                    {getReadableTime(item.spentTimeSeconds, t, {
                      short: true,
                    })}
                    , {t('plural.sessions', { count: item.sessionsAmount })})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityDistributionBox;
