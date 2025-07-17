import { FC, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchRangeAnalytics } from '../api/analyticsApi';
import { toast } from 'react-toastify';

import SessionStatisticsBox from '../components/SessionStatisticsBox';
import ActivityDistributionBox from '../components/ActivityDistributionBox';
import { ClipLoader } from 'react-spinners';
// TODO: использовать lazy loading
import DailyGoalBox from '../components/DailyGoalBox';
import DaysOfWeekBox from '../components/analyticsRangeBoxes/DaysOfWeekBox';
import WeeksBox from '../components/analyticsRangeBoxes/WeeksBox';
import MonthsBox from '../components/analyticsRangeBoxes/MonthsBox';
import YearsBox from '../components/analyticsRangeBoxes/YearsBox';
import CustomRangeBox from '../components/analyticsRangeBoxes/CustomRangeBox';

type RangeType = 'days' | 'weeks' | 'months' | 'years' | 'custom';

const getRangeType = (fromDate: Date, toDate: Date): RangeType => {
  const isStartOfDay = (date: Date) =>
    date.getHours() == 0 &&
    date.getMinutes() == 0 &&
    date.getSeconds() == 0 &&
    date.getMilliseconds() == 0;

  const isEndOfDay = (date: Date) =>
    date.getHours() == 23 &&
    date.getMinutes() == 59 &&
    date.getSeconds() == 59 &&
    date.getMilliseconds() == 999;

  if (
    // если fromDate и toDate - начала дня, а также разница между ними - ровно один день
    toDate.getTime() - fromDate.getTime() == 86400000 &&
    isStartOfDay(fromDate) &&
    isStartOfDay(toDate)
  ) {
    return 'days';
  } else if (
    // если fromDate - понедельник и начало дня, а toDate - воскресенье и конец дня, а также разница между ними - ровно одна неделя
    toDate.getTime() - fromDate.getTime() == 86400000 * 7 - 1 &&
    fromDate.getDay() == 1 &&
    toDate.getDay() == 0 &&
    isStartOfDay(fromDate) &&
    isEndOfDay(toDate)
  ) {
    return 'weeks';
  } else if (
    // если fromDate - начало месяца, а toDate - начало следующего месяца, а также разница между ними - ровно один месяц
    (toDate.getMonth() - fromDate.getMonth() == 1 ||
      (toDate.getMonth() == 0 && fromDate.getMonth() == 11)) &&
    fromDate.getDate() == 1 &&
    toDate.getDate() == 1 &&
    isStartOfDay(fromDate) &&
    isStartOfDay(toDate)
  ) {
    return 'months';
  } else if (
    // если fromDate - начало января года, а toDate - начало января следующего года, а также разница между ними - ровно один год
    toDate.getFullYear() - fromDate.getFullYear() == 1 &&
    fromDate.getMonth() == 0 &&
    toDate.getMonth() == 0 &&
    fromDate.getDate() == 1 &&
    toDate.getDate() == 1 &&
    isStartOfDay(fromDate) &&
    isStartOfDay(toDate)
  ) {
    return 'years';
  } else {
    return 'custom';
  }
};

const AnalyticsRangePage: FC = () => {
  const [searchParams] = useSearchParams();
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
  const [rangeType] = useState<RangeType>(getRangeType(fromDate, toDate));

  const {
    data: rangeAnalytics,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['rangeAnalytics', fromDate, toDate],
    queryFn: () => fetchRangeAnalytics(fromDate, toDate),
    retry: false,
  });

  useEffect(() => {
    setFromDate(new Date(fromParam));
    setToDate(new Date(toParam));
  }, [searchParams]);

  useEffect(() => {
    if (isError) {
      toast('A server error occurred while getting analytics', {
        type: 'error',
      });
    }
  }, [isError]);

  return (
    <div className="flex flex-col h-screen overflow-y-hidden bg-custom">
      {fromDate && toDate && (
        <div className="flex justify-center py-5 border-b border-solid border-b-gray-400">
          {rangeType == 'days' ? (
            <DaysOfWeekBox currentDay={fromDate} />
          ) : rangeType == 'weeks' ? (
            <WeeksBox fromDate={fromDate} toDate={toDate} />
          ) : rangeType == 'months' ? (
            <MonthsBox currentMonth={fromDate} />
          ) : rangeType == 'years' ? (
            <YearsBox currentYear={fromDate} />
          ) : rangeType == 'custom' ? (
            <CustomRangeBox fromDate={fromDate} toDate={toDate} />
          ) : (
            <></>
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
