import { FC, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDayRange } from '../helpers/dateHelpers';
import axios from '../axios';

import { ISessionStatistics } from '../ts/interfaces/Statistics/ISessionStatistics';
import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';

import SessionStatisticsBox from '../components/SessionStatisticsBox';
import ActivityDistributionBox from '../components/ActivityDistributionBox';
// TODO: использовать lazy loading
import DailyGoalBox from '../components/DailyGoalBox';
import DaysOfWeekBox from '../components/DaysOfWeekBox';
import MonthsBox from '../components/MonthsBox';
import YearsBox from '../components/YearsBox';

type RangeType = 'days' | 'months' | 'years' | 'custom';

const validateSearchParams = (
  fromParam: string | null,
  toParam: string | null
): [Date, Date] => {
  if (!fromParam) {
    throw new Error('from');
  }
  if (!toParam) {
    throw new Error('to');
  }

  const fromDate = new Date(fromParam);
  const toDate = new Date(toParam);
  if (!(fromDate instanceof Date)) {
    throw new Error('from');
  }
  if (!(toDate instanceof Date)) {
    throw new Error('to');
  }

  return [fromDate, toDate];
};

const AnalyticsRangePage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

  const [rangeType, setRangeType] = useState<RangeType>();

  const [rangeStatistics, setRangeStatistics] = useState<ISessionStatistics>();
  const [rangeActivityDistribution, setRangeActivityDistribution] =
    useState<IActivityDistribution[]>();

  const fetchRangeStatistics = async (fromDate: Date, toDate: Date) => {
    const { data } = await axios.get(
      `/analytics/?from=${fromDate.toISOString()}&to=${toDate.toISOString()}`
    );
    const statistics: ISessionStatistics = {
      sessionsAmount: data.sessionsAmount,
      spentTimeSeconds: data.spentTimeSeconds,
    };
    setRangeStatistics(statistics);

    const activityDistribution: IActivityDistribution[] =
      data.activityDistribution;
    setRangeActivityDistribution([...activityDistribution]);
  };

  const defineRangeType = (fromDate: Date, toDate: Date) => {
    if (toDate.getTime() - fromDate.getTime() == 86400000) {
      setRangeType('days');
    } else if (
      (toDate.getMonth() - fromDate.getMonth() == 1 ||
        (toDate.getMonth() == 0 && fromDate.getMonth() == 11)) &&
      fromDate.toISOString().substring(8) == '01T00:00:00.000Z' &&
      toDate.toISOString().substring(8) == '01T00:00:00.000Z'
    ) {
      setRangeType('months');
    } else if (
      toDate.getFullYear() - fromDate.getFullYear() == 1 &&
      fromDate.toISOString().substring(5) == '01-01T00:00:00.000Z' &&
      toDate.toISOString().substring(5) == '01-01T00:00:00.000Z'
    ) {
      setRangeType('years');
    } else {
      setRangeType('custom');
    }
  };

  useEffect(() => {
    try {
      const [fromDate, toDate] = validateSearchParams(fromParam, toParam);

      defineRangeType(fromDate, toDate);
    } catch (e) {
      const [defaultFrom, defaultTo] = getDayRange(new Date());

      setSearchParams(
        `?from=${defaultFrom.toISOString()}&to=${defaultTo.toISOString()}&set=123`
      );
      defineRangeType(defaultFrom, defaultTo);
    }
  }, []);

  useEffect(() => {
    try {
      const [fromDate, toDate] = validateSearchParams(fromParam, toParam);

      setFromDate(fromDate);
      setToDate(toDate);
    } catch (e) {
      const [defaultFrom, defaultTo] = getDayRange(new Date());

      setSearchParams(
        `?from=${defaultFrom.toISOString()}&to=${defaultTo.toISOString()}&set=123`
      );
    }
  }, [searchParams]);

  useEffect(() => {
    if (fromDate && toDate) {
      fetchRangeStatistics(fromDate, toDate);
    }
  }, [fromDate, toDate]);

  return (
    <div className="flex flex-col h-screen overflow-y-hidden bg-custom">
      {fromDate && toDate && (
        <div className="flex justify-center py-5 border-b border-solid border-b-gray-400">
          {rangeType == 'days' ? (
            <DaysOfWeekBox currentDay={fromDate} />
          ) : rangeType == 'months' ? (
            <MonthsBox currentMonth={fromDate} />
          ) : rangeType == 'years' ? (
            <YearsBox currentYear={fromDate} />
          ) : (
            // TODO: для кастомного выбора диапазона указать что-то другое
            <></>
          )}
        </div>
      )}

      {/* TODO: добавить какой-то loading */}
      {/* TODO: при переходе между датами тоже loading должен отображаться */}
      {rangeStatistics?.spentTimeSeconds !== 0 ? (
        <div className="flex h-full">
          <div className="flex flex-col w-1/2 h-full gap-5 px-4 pt-5 border-r border-gray-400 border-solid">
            {rangeStatistics && (
              <SessionStatisticsBox statistics={rangeStatistics} />
            )}

            {rangeActivityDistribution && (
              <div className="overflow-y-auto basis-3/5">
                <ActivityDistributionBox
                  activityDistributionItems={rangeActivityDistribution}
                />
              </div>
            )}
          </div>

          <div className="w-1/2 px-4">
            {rangeType == 'days' && rangeStatistics && (
              <DailyGoalBox
                spentTimeSeconds={rangeStatistics.spentTimeSeconds}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="mt-10 text-2xl font-bold text-center">
          No session activity for the specified dates
        </div>
      )}
    </div>
  );
};

export default AnalyticsRangePage;
