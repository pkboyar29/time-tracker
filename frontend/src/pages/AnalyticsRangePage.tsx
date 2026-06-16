import { FC, useState, useEffect, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../redux/store';

import SessionStatisticsBox from '../components/SessionStatisticsBox';
import ActivityDistributionBox from '../components/ActivityDistributionBox';
import PrimaryClipLoader from '../components/common/PrimaryClipLoader';
import CustomSelect from '../components/common/CustomSelect';
// TODO: использовать lazy loading
import DailyGoalBox from '../components/DailyGoalBox';
import PeriodDistributionBox from '../components/PeriodDistributionBox';
import RangeBox from '../components/analyticsRangeBoxes/RangeBox';
import CustomRangeBox from '../components/analyticsRangeBoxes/CustomRangeBox';
import OverallAnalyticsLabel from '../components/analyticsRangeBoxes/OverallAnalyticsLabel';

type ViewOption = RangeType & 'overall';

const AnalyticsRangePage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const overallMode: boolean =
    typeof searchParams.get('overall') === 'string' ? true : false;

  const currentUser = useAppSelector((state) => state.users.user);

  const viewOptionsArr = useMemo(
    () =>
      ['days', 'weeks', 'months', 'years', 'overall', 'custom'].map(
        (option) => ({
          id: option,
          name: t(`viewOptions.${option}`),
        }),
      ),
    [t],
  );

  // валидация search params
  if (
    !fromParam ||
    isNaN(new Date(fromParam).getTime()) ||
    !toParam ||
    isNaN(new Date(toParam).getTime())
  ) {
    return (
      <div className="mt-20 text-xl text-center dark:text-textDark">
        {t('analyticsPage.invalidFormat')}
      </div>
    );
  }

  const [adBoxMode, setAdBoxMode] = useState<'table' | 'chart'>('chart');

  const [range, setRange] = useState<{ fromDate: Date; toDate: Date }>({
    fromDate: new Date(fromParam),
    toDate: new Date(toParam),
  });
  const [rangeType, setRangeType] = useState<RangeType>(
    getRangeType(range.fromDate, range.toDate),
  );
  const viewOption = overallMode ? 'overall' : rangeType;

  const {
    data: rangeAnalytics,
    isLoading,
    isError,
  } = useQueryCustom({
    queryKey: ['rangeAnalytics', range.fromDate, range.toDate],
    queryFn: () => fetchRangeAnalytics(range.fromDate, range.toDate),
  });

  const onViewSelectChange = (selectedOption: ViewOption) => {
    if (selectedOption === viewOption) {
      return;
    }

    if (selectedOption === 'days') {
      const [startOfToday, endOfToday] = getDayRange(new Date());
      navigate(
        `/analytics/range?from=${startOfToday.toISOString()}&to=${endOfToday.toISOString()}`,
      );
    } else if (selectedOption === 'weeks') {
      const [startOfWeek, endOfWeek] = getWeekRange(new Date());
      navigate(
        `/analytics/range?from=${startOfWeek.toISOString()}&to=${endOfWeek.toISOString()}`,
      );
    } else if (selectedOption === 'months') {
      const [startOfMonth, endOfMonth] = getMonthRange(new Date());
      navigate(
        `/analytics/range?from=${startOfMonth.toISOString()}&to=${endOfMonth.toISOString()}`,
      );
    } else if (selectedOption === 'years') {
      const [startOfYear, endOfYear] = getYearRange(new Date());
      navigate(
        `/analytics/range?from=${startOfYear.toISOString()}&to=${endOfYear.toISOString()}`,
      );
    } else if (selectedOption === 'overall' && currentUser) {
      navigate(
        `/analytics/range?from=${currentUser.createdDate.toISOString()}&to=${new Date().toISOString()}&overall`,
      );
    } else if (selectedOption === 'custom') {
      const [startOfToday, endOfToday] = getDayRange(new Date());
      const customFromDate = new Date(startOfToday);
      customFromDate.setDate(customFromDate.getDate() - 1);
      navigate(
        `/analytics/range?from=${customFromDate.toISOString()}&to=${endOfToday.toISOString()}`,
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
      toast(t('serverErrors.getAnalytics'), {
        type: 'error',
      });
    }
  }, [isError]);

  return (
    <div className="flex flex-col h-full lg:overflow-y-hidden lg:h-screen dark:text-textDark">
      <div className="lg:max-h-[156px] lg:h-full relative flex flex-col justify-center pb-5 py-[65px] sm:py-5 border-b border-solid border-gray-400 dark:border-white/10">
        {rangeType === 'custom' ? (
          overallMode ? (
            <OverallAnalyticsLabel />
          ) : (
            <CustomRangeBox fromDate={range.fromDate} toDate={range.toDate} />
          )
        ) : (
          <RangeBox range={range} />
        )}

        <div className="w-[140px] ml-auto mr-4 mt-4 lg:ml-0 lg:mt-0 lg:mr-4 lg:absolute lg:top-10 lg:right-[8%]">
          <div className="text-right mb-1.5 text-lg font-semibold">
            {t('analyticsPage.viewSelectTitle')}
          </div>
          <CustomSelect
            currentId={viewOption}
            onChange={(option) => onViewSelectChange(option as ViewOption)}
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
        <div className="flex flex-col pb-5 lg:pb-0 lg:h-full lg:flex-row">
          <div className="flex flex-col h-full gap-5 px-4 pt-5 lg:w-1/2 lg:border-r lg:border-gray-400 lg:border-solid lg:dark:border-white/10">
            {rangeAnalytics.sessionStatistics && (
              <SessionStatisticsBox
                statistics={rangeAnalytics.sessionStatistics}
              />
            )}

            {rangeAnalytics.adItems && (
              <div className="overflow-y-auto max-h-[550px] lg:h-auto lg:basis-3/5">
                <ActivityDistributionBox
                  adItems={rangeAnalytics.adItems}
                  sessionStatistics={rangeAnalytics.sessionStatistics}
                  adBoxMode={adBoxMode}
                  setAdBoxMode={setAdBoxMode}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col h-full gap-5 px-4 pt-5 lg:w-1/2">
            {rangeAnalytics.timeBars.length > 1 && (
              <PeriodDistributionBox
                analytics={rangeAnalytics}
                setAdBoxMode={setAdBoxMode}
                overallMode={overallMode}
              />
            )}

            {rangeType == 'days' && (
              <DailyGoalBox
                spentTimeSeconds={
                  rangeAnalytics.sessionStatistics.spentTimeSeconds
                }
              />
            )}
          </div>
        </div>
      ) : (
        <div className="h-full px-2 pt-5 text-xl font-bold text-center md:text-2xl dark:text-textDark">
          {t('analyticsPage.noActivity')}
        </div>
      )}
    </div>
  );
};

export default AnalyticsRangePage;
