import { FC, useState } from 'react';
import { useAppSelector } from '../redux/store';
import { getReadableTime } from '../helpers/timeHelpers';
import { getRangeType } from '../helpers/dateHelpers';
import { colors } from '../../design-tokens';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
              {t('pdBox.noActivity')}
            </p>
          ) : (
            <>
              {!adMode ? (
                <>
                  {getRangeType(timeBar.startOfRange, timeBar.endOfRange) ==
                    'days' && (
                    <p className="text-gray-800 dark:text-textDark">
                      {`${t('pdBox.dailyGoal')} ${
                        timeBar.spentTimeSeconds >= dailyGoalSeconds
                          ? '✅'
                          : '❌'
                      }`}
                    </p>
                  )}

                  <p className="text-gray-800 dark:text-textDark">
                    {getReadableTime(timeBar.spentTimeSeconds, t, {
                      short: false,
                    })}
                  </p>

                  <p className="text-gray-800 dark:text-textDark">
                    {t('plural.sessions', { count: timeBar.sessionsAmount })}
                  </p>

                  <p className="text-gray-800 dark:text-textDark">
                    {t('plural.pauses', { count: timeBar.pausedAmount })}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-800 dark:text-textDark">
                    {getReadableTime(timeBar.spentTimeSeconds, t, {
                      short: false,
                    })}
                  </p>

                  <p className="text-gray-800 dark:text-textDark">
                    {t('plural.sessions', { count: timeBar.sessionsAmount })}
                  </p>
                </>
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
                            (
                            {getReadableTime(item.spentTimeSeconds, t, {
                              short: true,
                            })}
                            ,{' '}
                            {t('plural.sessions', {
                              count: item.sessionsAmount,
                            })}
                            )
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
  const { t } = useTranslation();

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
    <div className="relative pt-5 border border-solid rounded-lg bg-surfaceLight dark:bg-surfaceDark border-gray-300/80 dark:border-gray-500">
      <div className="sticky top-0 z-[39] flex justify-center px-5 pb-5 border-b border-solid min-[360px]:justify-end sm:px-10 border-gray-300/80 dark:border-gray-500">
        <div className="inline-block px-4 py-1 text-lg text-center font-medium tracking-wide rounded-lg text-gray-800 bg-gray-200 dark:bg-[rgba(255,255,255,0.05)] dark:text-textDark">
          {t('pdBox.title')}
        </div>
      </div>

      <div className="flex flex-col flex-wrap justify-between gap-4 px-5 py-5 sm:gap-2 sm:items-center sm:flex-row sm:px-10">
        <div className="flex items-center gap-4 text-[16px] dark:text-textDark">
          <ToggleButton isChecked={adMode} setIsChecked={toggleAdMode} />
          <div>{t('adBox.title')}</div>
        </div>

        {analytics.timeBars.length > 1 && (
          <div className="text-lg font-semibold dark:text-textDark">
            {t('pdBox.avg')}{' '}
            <span className="text-primary">
              {getReadableTime(
                analytics.sessionStatistics.averageSpentTimeSeconds,
                t,
                { short: true }
              )}
            </span>{' '}
            {getRangeType(
              analytics.timeBars[1].startOfRange,
              analytics.timeBars[1].endOfRange
            ) == 'days'
              ? t('pdBox.perDay')
              : t('pdBox.perMonth')}
          </div>
        )}
      </div>

      <div className="pb-5 overflow-x-auto scroll-overlay">
        <ResponsiveContainer
          minWidth={575}
          width="100%"
          className="px-5 sm:px-10"
          height={300}
        >
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
                    bar.spentTimeSeconds >= dailyGoalSeconds
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
                      const barActivityItem =
                        bar.activityDistributionItems.find(
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
    </div>
  );
};

export default PeriodDistributionBox;
