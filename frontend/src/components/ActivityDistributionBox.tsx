import { FC, useState, useRef, useMemo } from 'react';
import { getTimeHoursMinutes } from '../helpers/timeHelpers';
import { PieChart, Pie, ResponsiveContainer } from 'recharts';

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
          activityGroup: { _id: '', name: '' },
          activityName: 'Others',
          sessionsAmount: othersSessionsAmount,
          spentTimeSeconds: othersSpentTimeSeconds,
          spentTimePercentage: othersSpentTimePercentage,
        },
      ];
    }

    // TODO: можно установить исключения для нескольких цветов, которые есть в самом интерфейсе
    const hexColors = Array.from(
      { length: pieItems.length },
      () =>
        '#' +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, '0')
    );

    return pieItems.map((item, index) => ({
      ...item,
      fill: hexColors[index],
    }));
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
      className="h-full pb-5 overflow-y-auto bg-white border border-solid rounded-lg border-gray-300/80"
    >
      <div className="sticky top-0 z-50 flex items-start justify-between px-10 pt-5 bg-white border-b border-solid border-gray-300/80">
        <div className="flex gap-2.5 text-[15px]">
          <button
            onClick={onTableBarClick}
            className={`transition duration-300 hover:text-primary ${
              activeBar == 'table' && 'text-primary'
            }`}
          >
            Table
          </button>
          <button
            onClick={onChartBarClick}
            className={`transition duration-300 hover:text-primary ${
              activeBar == 'chart' && 'text-primary'
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
        <div className="px-10">
          <div className="flex my-3.5 text-lg tracking-wide text-gray-800">
            <div className="w-1/2">Activity</div>
            <div className="w-1/5">Sessions</div>
            <div className="w-1/5">Time</div>
            <div className="w-1/5">Ratio</div>
          </div>
          <div className="flex flex-col gap-3">
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
                  <div className="text-lg truncate">{item.activityName}</div>
                  <div className="text-base text-gray-600">
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
