import { FC, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryCustom } from '../hooks/useQueryCustom';
import { fetchRangeAnalytics } from '../api/analyticsApi';
import { toast } from 'react-toastify';
import { getRangeType, RangeType } from '../helpers/dateHelpers';

import SessionStatisticsBox from '../components/SessionStatisticsBox';
import ActivityDistributionBox from '../components/ActivityDistributionBox';
import PrimaryClipLoader from '../components/PrimaryClipLoader';
// TODO: использовать lazy loading
import DailyGoalBox from '../components/DailyGoalBox';
import PeriodDistributionBox from '../components/PeriodDistributionBox';
import RangeBox from '../components/analyticsRangeBoxes/RangeBox';
import CustomRangeBox from '../components/analyticsRangeBoxes/CustomRangeBox';

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
  } = useQueryCustom({
    queryKey: ['rangeAnalytics', fromDate, toDate],
    queryFn: () => fetchRangeAnalytics(fromDate, toDate),
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
    <div className="flex flex-col h-screen overflow-y-hidden">
      {fromDate && toDate && (
        <div className="flex justify-center py-5 border-b border-solid border-b-gray-400 dark:border-b-gray-500">
          {rangeType == 'custom' ? (
            <CustomRangeBox fromDate={fromDate} toDate={toDate} />
          ) : (
            <RangeBox
              rangeType={rangeType}
              fromDate={fromDate}
              toDate={toDate}
            />
          )}
        </div>
      )}

      {isLoading ? (
        <div className="mt-5 text-center">
          <PrimaryClipLoader />
        </div>
      ) : rangeAnalytics &&
        rangeAnalytics.sessionStatistics.spentTimeSeconds !== 0 ? (
        <div className="flex h-full">
          <div className="flex flex-col w-1/2 h-full gap-5 px-4 pt-5 border-r border-gray-400 border-solid dark:border-gray-500">
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

          <div className="w-1/2 px-4 pt-5">
            {rangeType == 'days' && rangeAnalytics.sessionStatistics && (
              <DailyGoalBox
                spentTimeSeconds={
                  rangeAnalytics.sessionStatistics.spentTimeSeconds
                }
              />
            )}
            {rangeType != 'days' && (
              <PeriodDistributionBox timeBars={rangeAnalytics.timeBars} />
            )}
          </div>
        </div>
      ) : (
        <div className="mt-10 text-2xl font-bold text-center dark:text-textDark">
          No session activity for the specified dates
        </div>
      )}
    </div>
  );
};

export default AnalyticsRangePage;
