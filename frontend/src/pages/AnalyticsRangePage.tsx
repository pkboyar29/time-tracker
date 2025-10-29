import { FC, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryCustom } from '../hooks/useQueryCustom';
import { fetchRangeAnalytics } from '../api/analyticsApi';
import { toast } from 'react-toastify';
import {
  getRangeType,
  RangeType,
  getDayRange,
  getWeekRange,
  getMonthRange,
  getYearRange,
} from '../helpers/dateHelpers';

import SessionStatisticsBox from '../components/SessionStatisticsBox';
import ActivityDistributionBox from '../components/ActivityDistributionBox';
import PrimaryClipLoader from '../components/PrimaryClipLoader';
import CustomSelect from '../components/CustomSelect';
// TODO: использовать lazy loading
import DailyGoalBox from '../components/DailyGoalBox';
import PeriodDistributionBox from '../components/PeriodDistributionBox';
import RangeBox from '../components/analyticsRangeBoxes/RangeBox';
import CustomRangeBox from '../components/analyticsRangeBoxes/CustomRangeBox';

const viewOptions: Record<RangeType, string> = {
  days: '0',
  weeks: '1',
  months: '2',
  years: '3',
  overall: '4',
  custom: '5',
};
const viewOptionsArr = Object.entries(viewOptions).map((opt) => {
  return { id: opt[1], name: opt[0] };
});

const AnalyticsRangePage: FC = () => {
  const navigate = useNavigate();
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

  const [adBoxMode, setAdBoxMode] = useState<'table' | 'chart'>('table');

  const [range, setRange] = useState<{ fromDate: Date; toDate: Date }>({
    fromDate: new Date(fromParam),
    toDate: new Date(toParam),
  });
  const [rangeType, setRangeType] = useState<RangeType>(
    getRangeType(range.fromDate, range.toDate)
  );

  const viewId = viewOptions[rangeType];

  const {
    data: rangeAnalytics,
    isLoading,
    isError,
  } = useQueryCustom({
    queryKey: ['rangeAnalytics', range.fromDate, range.toDate],
    queryFn: () => fetchRangeAnalytics(range.fromDate, range.toDate),
  });

  const onViewSelectChange = (id: string) => {
    if (id == viewId) {
      return;
    }

    if (id == '0') {
      const [startOfToday, endOfToday] = getDayRange(new Date());
      navigate(
        `/analytics/range?from=${startOfToday.toISOString()}&to=${endOfToday.toISOString()}`
      );
    } else if (id == '1') {
      const [startOfWeek, endOfWeek] = getWeekRange(new Date());
      navigate(
        `/analytics/range?from=${startOfWeek.toISOString()}&to=${endOfWeek.toISOString()}`
      );
    } else if (id == '2') {
      const [startOfMonth, endOfMonth] = getMonthRange(new Date());
      navigate(
        `/analytics/range?from=${startOfMonth.toISOString()}&to=${endOfMonth.toISOString()}`
      );
    } else if (id == '3') {
      const [startOfYear, endOfYear] = getYearRange(new Date());
      navigate(
        `/analytics/range?from=${startOfYear.toISOString()}&to=${endOfYear.toISOString()}`
      );
    } else if (id == '4') {
      navigate(
        `/analytics/range?from=2000-01-01T00:00:00&to=${new Date().toISOString()}`
      );
    } else if (id == '5') {
      const [startOfToday, endOfToday] = getDayRange(new Date());
      const customFromDate = new Date(startOfToday);
      customFromDate.setDate(customFromDate.getDate() - 1);
      navigate(
        `/analytics/range?from=${customFromDate.toISOString()}&to=${endOfToday.toISOString()}`
      );
    }
  };

  useEffect(() => {
    setRange({ fromDate: new Date(fromParam), toDate: new Date(toParam) });
  }, [searchParams]);

  useEffect(() => {
    setRangeType(getRangeType(range.fromDate, range.toDate));
  }, [range]);

  useEffect(() => {
    if (isError) {
      toast('A server error occurred while getting analytics', {
        type: 'error',
      });
    }
  }, [isError]);

  return (
    <div className="flex flex-col h-screen overflow-y-hidden dark:text-textDark">
      <div className="h-[164px] relative flex justify-center py-5 border-b border-solid border-b-gray-400 dark:border-b-gray-500">
        {rangeType == 'custom' ? (
          <CustomRangeBox fromDate={range.fromDate} toDate={range.toDate} />
        ) : rangeType == 'overall' ? (
          <div className="h-full py-10 text-xl font-semibold select-none">
            Overall session analytics
          </div>
        ) : (
          <RangeBox range={range} />
        )}

        <div className="w-[140px] absolute top-10 right-48">
          <div className="text-right mb-1.5 text-lg font-semibold">View by</div>
          <CustomSelect
            currentId={viewId}
            onChange={onViewSelectChange}
            optionGroups={[
              {
                optGroupName: '',
                color: 'standart',
                options: [...viewOptionsArr],
              },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-full pt-5 text-center">
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
                  adBoxMode={adBoxMode}
                  setAdBoxMode={setAdBoxMode}
                />
              </div>
            )}
          </div>

          <div className="w-1/2 px-4 pt-5">
            {rangeType == 'days' ? (
              <DailyGoalBox
                spentTimeSeconds={
                  rangeAnalytics.sessionStatistics.spentTimeSeconds
                }
              />
            ) : rangeType != 'overall' && rangeAnalytics.timeBars.length > 0 ? (
              <PeriodDistributionBox
                analytics={rangeAnalytics}
                setAdBoxMode={setAdBoxMode}
              />
            ) : null}
          </div>
        </div>
      ) : (
        <div className="h-full pt-5 text-2xl font-bold text-center dark:text-textDark">
          No session activity for the specified dates
        </div>
      )}
    </div>
  );
};

export default AnalyticsRangePage;
