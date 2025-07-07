import { FC, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchRangeAnalytics } from '../api/analyticsApi';

import SessionStatisticsBox from '../components/SessionStatisticsBox';
import ActivityDistributionBox from '../components/ActivityDistributionBox';
import { ClipLoader } from 'react-spinners';
// TODO: использовать lazy loading
import DailyGoalBox from '../components/DailyGoalBox';
import DaysOfWeekBox from '../components/DaysOfWeekBox';
import MonthsBox from '../components/MonthsBox';
import YearsBox from '../components/YearsBox';
import CustomRangeBox from '../components/CustomRangeBox';

type RangeType = 'days' | 'months' | 'years' | 'custom';

const AnalyticsRangePage: FC = () => {
  const [searchParams, _] = useSearchParams();
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  // валидация search params
  if (
    !fromParam ||
    isNaN(new Date(fromParam).getTime()) ||
    !toParam ||
    isNaN(new Date(toParam).getTime())
  ) {
    return (
      <div className="mt-4 text-lg text-center">Invalid date format in URL</div>
    );
  }

  const [fromDate, setFromDate] = useState<Date>(new Date(fromParam));
  const [toDate, setToDate] = useState<Date>(new Date(toParam));

  const [rangeType, setRangeType] = useState<RangeType>();

  const { data: rangeAnalytics, isLoading } = useQuery({
    queryKey: ['rangeAnalytics', fromDate, toDate],
    queryFn: () => fetchRangeAnalytics(fromDate, toDate),
  });

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
    defineRangeType(fromDate, toDate);
  }, []);

  useEffect(() => {
    setFromDate(new Date(fromParam));
    setToDate(new Date(toParam));
  }, [searchParams]);

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
            <CustomRangeBox fromDate={fromDate} toDate={toDate} />
          )}
        </div>
      )}

      {isLoading ? (
        <div className="mt-5 text-center">
          <ClipLoader color="#EF4444" />
        </div>
      ) : rangeAnalytics &&
        rangeAnalytics.sessionStatistics.spentTimeSeconds !== 0 ? (
        <div className="flex h-full">
          <div className="flex flex-col w-1/2 h-full gap-5 px-4 pt-5 border-r border-gray-400 border-solid">
            {rangeAnalytics.sessionStatistics && (
              <SessionStatisticsBox
                statistics={rangeAnalytics.sessionStatistics}
              />
            )}

            {rangeAnalytics.activityDistributionItems && (
              <div className="overflow-y-auto basis-3/5">
                <ActivityDistributionBox
                  activityDistributionItems={
                    rangeAnalytics.activityDistributionItems
                  }
                />
              </div>
            )}
          </div>

          <div className="w-1/2 px-4">
            {rangeType == 'days' && rangeAnalytics.sessionStatistics && (
              <div className="pt-5">
                <DailyGoalBox
                  spentTimeSeconds={
                    rangeAnalytics.sessionStatistics.spentTimeSeconds
                  }
                />
              </div>
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
