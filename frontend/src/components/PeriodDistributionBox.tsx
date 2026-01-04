import { FC, useState, useEffect, useMemo } from 'react';
import { useAppSelector } from '../redux/store';
import { getReadableTime } from '../helpers/timeHelpers';
import { getRangeType } from '../helpers/dateHelpers';
import { colors } from '../../design-tokens';
import { useTranslation } from 'react-i18next';
import { splitTimeBars } from '../helpers/splitTimeBars';

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
import SegmentedControl from './common/SegmentedControl';

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
          {timeBar.sessionStatistics.spentTimeSeconds == 0 ? (
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
                        timeBar.sessionStatistics.spentTimeSeconds >=
                        dailyGoalSeconds
                          ? '✅'
                          : '❌'
                      }`}
                    </p>
                  )}

                  <p className="text-gray-800 dark:text-textDark">
                    {getReadableTime(
                      timeBar.sessionStatistics.spentTimeSeconds,
                      t,
                      {
                        short: false,
                      }
                    )}
                  </p>

                  <p className="text-gray-800 dark:text-textDark">
                    {t('plural.sessions', {
                      count: timeBar.sessionStatistics.sessionsAmount,
                    })}
                  </p>

                  <p className="text-gray-800 dark:text-textDark">
                    {t('plural.pauses', {
                      count: timeBar.sessionStatistics.pausedAmount,
                    })}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-800 dark:text-textDark">
                    {getReadableTime(
                      timeBar.sessionStatistics.spentTimeSeconds,
                      t,
                      {
                        short: false,
                      }
                    )}
                  </p>

                  <p className="text-gray-800 dark:text-textDark">
                    {t('plural.sessions', {
                      count: timeBar.sessionStatistics.sessionsAmount,
                    })}
                  </p>
                </>
              )}

              {adMode && (
                <>
                  {timeBar.adItems.map(
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
                            {getReadableTime(
                              item.sessionStatistics.spentTimeSeconds,
                              t,
                              {
                                short: true,
                              }
                            )}
                            ,{' '}
                            {t('plural.sessions', {
                              count: item.sessionStatistics.sessionsAmount,
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

type SplitMode = 'default' | '4' | '3' | '2';

const PeriodDistributionBox: FC<PeriodDistributionBoxProps> = ({
  analytics,
  setAdBoxMode,
}) => {
  const { t } = useTranslation();

  const [adMode, setAdMode] = useState<boolean>(false);

  const splitOptions = useMemo<{ value: string; label: string }[]>(() => {
    const options = [{ value: 'default', label: t('pdBox.default') }];
    if (analytics.timeBars.length >= 8) {
      options.push({
        value: '4',
        label: t('pdBox.4parts'),
      });
    }
    if (analytics.timeBars.length >= 6) {
      options.push({
        value: '3',
        label: t('pdBox.3parts'),
      });
    }
    if (analytics.timeBars.length > 2) {
      options.push({
        value: '2',
        label: t('pdBox.2parts'),
      });
    }
    if (analytics.timeBars.length < 2) {
      return [];
    }

    return options;
  }, [analytics.timeBars]);

  const [splitMode, setSplitMode] = useState<SplitMode>('default');
  useEffect(() => {
    setSplitMode('default');
    setAdMode(false);
  }, [analytics]);

  const displayTimeBars = useMemo<ITimeBar[]>(() => {
    if (splitMode == 'default') {
      return analytics.timeBars;
    } else {
      return splitTimeBars(analytics.timeBars, Number(splitMode), t);
    }
  }, [analytics.timeBars, splitMode]);

  const averageSpentTimeSeconds = useMemo<number>(() => {
    let timeBarsLength = 0;
    for (let i = 0; i < displayTimeBars.length; i++) {
      if (displayTimeBars[i].startOfRange > new Date()) {
        timeBarsLength = i;
        break;
      }

      if (i == displayTimeBars.length - 1) {
        timeBarsLength = displayTimeBars.length;
      }
    }

    return timeBarsLength == 0
      ? 0
      : analytics.sessionStatistics.spentTimeSeconds / timeBarsLength;
  }, [analytics.sessionStatistics, displayTimeBars]);

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
        <div className="flex items-center gap-4 text-[16px] leading-6 dark:text-textDark">
          <ToggleButton isChecked={adMode} setIsChecked={toggleAdMode} />
          <div>{t('adBox.title')}</div>
        </div>

        <SegmentedControl
          options={splitOptions}
          value={splitMode}
          onChange={(value) => {
            setSplitMode(value as SplitMode);
          }}
        />
      </div>

      {displayTimeBars.length > 1 && (
        <div className="flex px-5 pb-5 text-lg font-semibold sm:justify-end sm:px-10 dark:text-textDark">
          <div>
            {t('pdBox.avg')}{' '}
            <span className="text-primary">
              {getReadableTime(averageSpentTimeSeconds, t, {
                short: true,
              })}
            </span>{' '}
            {t('pdBox.perPart')}
          </div>
        </div>
      )}

      <div className="pb-5 overflow-x-auto scroll-overlay">
        <ResponsiveContainer
          minWidth={575}
          width="100%"
          className="px-5 sm:px-10"
          height={300}
        >
          <BarChart
            data={displayTimeBars}
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
            <YAxis dataKey="sessionStatistics.spentTimeSeconds" />
            <Tooltip content={<CustomTooltip adMode={adMode} />} />
            {!adMode ? (
              <Bar
                isAnimationActive={true}
                dataKey="sessionStatistics.spentTimeSeconds"
              >
                {displayTimeBars.map((bar, index) => {
                  const color =
                    getRangeType(bar.startOfRange, bar.endOfRange) == 'days' &&
                    bar.sessionStatistics.spentTimeSeconds >= dailyGoalSeconds
                      ? colors.primary
                      : localStorage.getItem('theme') === 'dark'
                      ? '#424242'
                      : '#E5E7EB';

                  return <Cell key={index} fill={color} />;
                })}
              </Bar>
            ) : (
              analytics.adItems.map((ad, index) => {
                return (
                  <Bar
                    key={index}
                    dataKey={(bar) => {
                      const barActivityItem = bar.adItems.find(
                        (item: IActivityDistribution) =>
                          item.activityName === ad.activityName
                      );
                      return barActivityItem
                        ? barActivityItem.sessionStatistics.spentTimeSeconds
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
