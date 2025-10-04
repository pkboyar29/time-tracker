import { FC, useState, useRef, useMemo } from 'react';
import { getTimeHoursMinutes } from '../helpers/timeHelpers';
import { PieChart, Pie, ResponsiveContainer } from 'recharts';
import { colors } from '../../design-tokens';

import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';

interface ActivityDistributionBoxProps {
  activityDistributionItems: IActivityDistribution[];
}

const ActivityDistributionBox: FC<ActivityDistributionBoxProps> = ({
  activityDistributionItems,
}) => {
  const [activeBar, setActiveBar] = useState<'table' | 'chart'>('table');
  const rootRef = useRef<HTMLDivElement>(null);

  const sortedItems = useMemo(() => {
    return activityDistributionItems.toSorted(
      (a, b) => b.spentTimeSeconds - a.spentTimeSeconds
    );
  }, [activityDistributionItems]);

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
      let othersSpentTimePercentage = 0;

      for (let i = 1; i <= lessOnePercentageCount; i++) {
        const deletedLastItem = pieItems.pop();
        othersSessionsAmount += deletedLastItem
          ? deletedLastItem.sessionsAmount
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
          activityName: 'Others',
          sessionsAmount: othersSessionsAmount,
          spentTimeSeconds: othersSpentTimeSeconds,
          spentTimePercentage: othersSpentTimePercentage,
          fill: '#4287f5',
        },
      ];
    }

    return pieItems;
  }, [sortedItems]);

  const onTableBarClick = () => {
    if (activeBar == 'chart') {
      setActiveBar('table');
    }

    rootRef.current?.scrollTo({
      left: 0,
      top: 0,
      behavior: 'smooth',
    });
  };

  const onChartBarClick = () => {
    if (activeBar == 'table') {
      setActiveBar('chart');
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
      className="h-full pb-5 overflow-y-auto border border-solid rounded-lg bg-surfaceLight dark:bg-surfaceDark border-gray-300/80 dark:border-gray-500"
    >
      <div className="sticky top-0 z-50 flex items-start justify-between px-10 pt-5 border-b border-solid bg-surfaceLight dark:bg-surfaceDark border-gray-300/80 dark:border-gray-500">
        <div className="flex gap-2.5 text-[15px]">
          <button
            onClick={onTableBarClick}
            className={`transition duration-300 hover:text-primary dark:hover:text-primary ${
              activeBar == 'table'
                ? 'text-primary dark:text-primary'
                : 'dark:text-textDark'
            }`}
          >
            Table
          </button>
          <button
            onClick={onChartBarClick}
            className={`transition duration-300 hover:text-primary dark:hover:text-primary ${
              activeBar == 'chart'
                ? 'text-primary dark:text-primary'
                : 'dark:text-textDark'
            }`}
          >
            Chart
          </button>
        </div>

        {/* TODO: странно указывать mb-4 тут */}
        <div className="inline-block px-4 py-1 mb-4 ml-auto mr-0 text-lg font-medium tracking-wide text-right text-gray-800 bg-gray-200 rounded-lg dark:bg-[rgba(255,255,255,0.05)] dark:text-textDark">
          Activity distribution
        </div>
      </div>

      {activeBar == 'table' && (
        <div className="px-10">
          <div className="flex my-3.5 text-lg tracking-wide text-gray-800 dark:text-textDarkSecondary">
            <div className="w-1/2">Activity</div>
            <div className="w-1/5">Sessions</div>
            <div className="w-1/5">Time</div>
            <div className="w-1/5">Ratio</div>
          </div>
          <div className="flex flex-col gap-3 dark:text-textDark">
            {sortedItems.map((item, index) => (
              <div className="flex items-center text-base" key={index}>
                <div className="w-1/2 text-lg font-bold truncate">
                  {item.activityName}
                </div>
                <div className="w-1/5">{item.sessionsAmount}</div>
                <div className="w-1/5">
                  {getTimeHoursMinutes(item.spentTimeSeconds, true)}
                </div>
                <div className="w-1/5">
                  {Math.trunc(item.spentTimePercentage * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeBar == 'chart' && (
        <div className="flex justify-between px-10 my-3.5">
          <div className="sticky flex items-start self-start justify-center w-1/2 top-10">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
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

          <div className="w-1/2 flex flex-col gap-2.5">
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
                    ({getTimeHoursMinutes(item.spentTimeSeconds, true)},{' '}
                    {item.sessionsAmount} sessions)
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
