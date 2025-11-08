import { FC, useState, useEffect } from 'react';
import { useAppSelector } from '../redux/store';
import { getReadableTimeHMS } from '../helpers/timeHelpers';
import { getRangeType } from '../helpers/dateHelpers';
import { colors } from '../../design-tokens';

import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';
import { ITimeBar } from '../ts/interfaces/Statistics/ITimeBar';
import { IAnalytics } from '../ts/interfaces/Statistics/IAnaltytics';

import {
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import ToggleButton from './common/ToggleButton';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: number;
  adMode: boolean;
}
const CustomTooltip: FC<CustomTooltipProps> = ({ active, payload, adMode }) => {
  const isVisible = active && payload && payload.length;

  const timeBar: ITimeBar = payload[0]?.payload;

  const userInfo = useAppSelector((state) => state.users.user);
  const dailyGoalSeconds = userInfo ? userInfo.dailyGoal : 0;

  return (
    <div
      className="p-2.5 bg-surfaceLight dark:bg-surfaceDark rounded-sm border border-gray-300/80 border-solid w-[210px]"
      style={{ visibility: isVisible ? 'visible' : 'hidden' }}
    >
      {isVisible && (
        <div className="flex flex-col gap-2.5">
          <p className="text-primary text-[15px]">{`${timeBar.barDetailedName}`}</p>
          {timeBar.spentTimeSeconds == 0 ? (
            <p className="text-gray-800 dark:text-textDark">
              No session activity this period
            </p>
          ) : (
            <>
              {!adMode ? (
                <>
                  <p className="text-gray-800 dark:text-textDark">
                    {getReadableTimeHMS(timeBar.spentTimeSeconds)}

                    {getRangeType(timeBar.startOfRange, timeBar.endOfRange) ==
                      'days' &&
                      (timeBar.spentTimeSeconds > dailyGoalSeconds
                        ? ' (daily goal ✅)'
                        : ' (daily goal ❌)')}
                  </p>
                  <p className="text-gray-800 dark:text-textDark">
                    {timeBar.sessionsAmount} sessions
                  </p>
                  <p className="text-gray-800 dark:text-textDark">
                    {timeBar.pausedAmount} pauses
                  </p>
                </>
              ) : (
                <p className="text-gray-800 dark:text-textDark">
                  {getReadableTimeHMS(timeBar.spentTimeSeconds)},{' '}
                  {timeBar.sessionsAmount} sessions
                </p>
              )}

              {adMode && (
                <>
                  {timeBar.activityDistributionItems.map(
                    (item: IActivityDistribution, index: number) => (
                      <div className="flex items-center gap-2.5" key={index}>
                        <div
                          style={{ backgroundColor: item.fill }}
                          className="w-10 h-3 rounded-lg shrink-0"
                        />

                        <div className="flex flex-col min-w-0">
                          <div className="text-[15px] truncate dark:text-textDark">
                            {item.activityName}
                          </div>
                          <div className="text-[13px] mt-1 text-gray-600 dark:text-textDarkSecondary">
                            ({getReadableTimeHMS(item.spentTimeSeconds, true)},{' '}
                            {item.sessionsAmount} sessions)
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

interface PeriodDistributionBoxProps {
  analytics: IAnalytics;
  setAdBoxMode: (newAdMode: 'table' | 'chart') => void;
}

const PeriodDistributionBox: FC<PeriodDistributionBoxProps> = ({
  analytics,
  setAdBoxMode,
}) => {
  const [adMode, setAdMode] = useState<boolean>(false);

  const userInfo = useAppSelector((state) => state.users.user);
  const dailyGoalSeconds = userInfo ? userInfo.dailyGoal : 0;

  // const [isBarAnimationActive, setIsBarAnimationActive] = useState(true);
  // useEffect(() => {
  //   setIsBarAnimationActive(false);
  //   // сразу после рендера выключаем, чтобы не было лишней анимации на обновлениях
  //   // const timeout = requestAnimationFrame(() => setIsBarAnimationActive(false));
  //   // return () => cancelAnimationFrame(timeout);
  // }, [timeBars]);

  const toggleAdMode = (newAdMode: boolean) => {
    if (newAdMode) {
      setAdBoxMode('chart');
    }

    setAdMode(newAdMode);
  };

  return (
    <div className="relative py-5 border border-solid rounded-lg bg-surfaceLight dark:bg-surfaceDark border-gray-300/80 dark:border-gray-500">
      <div className="sticky top-0 z-50 flex justify-end px-10 pb-5 border-b border-solid border-gray-300/80 dark:border-gray-500">
        <div className="inline-block px-4 py-1 ml-auto text-lg font-medium tracking-wide rounded-lg text-gray-800 bg-gray-200 dark:bg-[rgba(255,255,255,0.05)] dark:text-textDark">
          Period distribution
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-10 py-5">
        <div className="flex items-center gap-4 text-[16px] dark:text-textDark">
          <ToggleButton isChecked={adMode} setIsChecked={toggleAdMode} />
          <div>Activity distribution</div>
        </div>

        <div className="text-lg font-semibold dark:text-textDark">
          Avg.{' '}
          <span className="text-primary">
            {getReadableTimeHMS(
              analytics.sessionStatistics.averageSpentTimeSeconds,
              true
            )}
          </span>{' '}
          per{' '}
          {getRangeType(
            analytics.timeBars[1].startOfRange,
            analytics.timeBars[1].endOfRange
          ) == 'days'
            ? 'day'
            : 'month'}
        </div>
      </div>

      <ResponsiveContainer width="100%" className="px-10" height={300}>
        <BarChart
          data={analytics.timeBars}
          className="dark:[&>svg>path]:fill-[#5c5c5c]"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="barName"
            // tick={{
            //   fill:
            //     localStorage.getItem('theme') === 'dark'
            //       ? colors.textDarkSecondary
            //       : '#000',
            // }}
          />
          <YAxis dataKey="spentTimeSeconds" />
          <Tooltip content={<CustomTooltip adMode={adMode} />} />
          {!adMode ? (
            <Bar isAnimationActive={true} dataKey="spentTimeSeconds">
              {analytics.timeBars.map((bar, index) => {
                const color =
                  getRangeType(bar.startOfRange, bar.endOfRange) == 'days' &&
                  bar.spentTimeSeconds > dailyGoalSeconds
                    ? colors.primary
                    : localStorage.getItem('theme') === 'dark'
                    ? '#424242'
                    : '#E5E7EB';

                return <Cell key={index} fill={color} />;
              })}
            </Bar>
          ) : (
            analytics.activityDistributionItems.map((ad, index) => {
              return (
                <Bar
                  key={index}
                  dataKey={(bar) => {
                    const barActivityItem = bar.activityDistributionItems.find(
                      (item: IActivityDistribution) =>
                        item.activityName === ad.activityName
                    );
                    return barActivityItem
                      ? barActivityItem.spentTimeSeconds
                      : '';
                  }}
                  fill={ad.fill}
                  stackId="a"
                  isAnimationActive={false}
                />
              );
            })
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PeriodDistributionBox;
