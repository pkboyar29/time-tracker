import { FC, useState, useMemo } from 'react';
import { getTimeHoursMinutes } from '../helpers/timeHelpers';
import { PieChart, Pie } from 'recharts';

import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';

interface ActivityDistributionBoxProps {
  activityDistributionItems: IActivityDistribution[];
}

const ActivityDistributionBox: FC<ActivityDistributionBoxProps> = ({
  activityDistributionItems,
}) => {
  const [activeBar, setActiveBar] = useState<'table' | 'chart'>('table');

  const hexColors = useMemo(() => {
    return Array.from(
      { length: activityDistributionItems.length },
      () =>
        '#' +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, '0')
    );
  }, [activityDistributionItems]);

  const sortedItemsWithColors = useMemo(() => {
    return activityDistributionItems
      .toSorted((a, b) => b.spentTimeSeconds - a.spentTimeSeconds)
      .map((item, index) => ({
        ...item,
        fill: hexColors[index],
      }));
  }, [activityDistributionItems]);

  return (
    <div className="h-full px-10 py-5 overflow-y-auto bg-white border border-solid rounded-lg border-gray-300/80">
      <div className="flex items-start justify-between">
        <div className="flex gap-2.5 text-[15px]">
          <button
            onClick={() => {
              if (activeBar == 'chart') {
                setActiveBar('table');
              }
            }}
            className={`transition duration-300 hover:text-red-500 ${
              activeBar == 'table' && 'text-red-500'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => {
              if (activeBar == 'table') {
                setActiveBar('chart');
              }
            }}
            className={`transition duration-300 hover:text-red-500 ${
              activeBar == 'chart' && 'text-red-500'
            }`}
          >
            Chart
          </button>
        </div>

        <div className="inline-block px-4 py-1 mb-4 ml-auto mr-0 text-lg font-medium tracking-wide text-right text-gray-800 bg-gray-200 rounded-lg">
          Activity distribution
        </div>
      </div>

      {activeBar == 'table' && (
        <>
          <div className="flex my-3.5 text-lg tracking-wide text-gray-800">
            <div className="w-1/2">Activity</div>
            <div className="w-1/5">Sessions</div>
            <div className="w-1/5">Time</div>
            <div className="w-1/5">Ratio</div>
          </div>
          <div className="flex flex-col gap-3">
            {sortedItemsWithColors.map((item, index) => (
              <div className="flex items-center text-base" key={index}>
                <div className="w-1/2 text-lg font-bold">
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
        </>
      )}

      {activeBar == 'chart' && (
        <div className="flex justify-between">
          <div className="w-1/2">
            <PieChart width={250} height={250}>
              <Pie
                animationDuration={750}
                data={sortedItemsWithColors}
                dataKey="spentTimeSeconds"
                nameKey="activityName"
                cx="40%"
                cy="40%"
                outerRadius={100}
              />
            </PieChart>
          </div>

          <div className="w-1/2 flex flex-col gap-2.5">
            {sortedItemsWithColors.map((item, index) => (
              <div className="flex items-center gap-2" key={index}>
                <div
                  style={{ backgroundColor: item.fill }}
                  className="w-12 h-3 rounded-lg"
                />
                <div className="text-lg">{item.activityName}</div>
                <div className="text-base">
                  ({getTimeHoursMinutes(item.spentTimeSeconds, true)},{' '}
                  {item.sessionsAmount} sessions)
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
