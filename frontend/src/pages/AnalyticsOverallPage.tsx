import { FC, useEffect } from 'react';
import { useQueryCustom } from '../hooks/useQueryCustom';
import { fetchOverallAnalytics } from '../api/analyticsApi';
import {
  getDayRange,
  getWeekRange,
  getMonthRange,
  getYearRange,
} from '../helpers/dateHelpers';
import { toast } from 'react-toastify';

import Title from '../components/Title';
import SessionStatisticsBox from '../components/SessionStatisticsBox';
import ActivityDistributionBox from '../components/ActivityDistributionBox';
import LinkBox from '../components/LinkBox';
import PrimaryClipLoader from '../components/PrimaryClipLoader';

const AnalyticsOverallPage: FC = () => {
  const [startOfDay, endOfDay] = getDayRange(new Date());
  const [startOfWeek, endOfWeek] = getWeekRange(new Date());
  const [startOfMonth, endOfMonth] = getMonthRange(new Date());
  const [startOfYear, endOfYear] = getYearRange(new Date());

  const customFromDate = new Date(startOfDay);
  customFromDate.setDate(customFromDate.getDate() - 1);

  const {
    data: overallAnalytics,
    isLoading,
    isError,
  } = useQueryCustom({
    queryKey: ['overallAnalytics'],
    queryFn: fetchOverallAnalytics,
  });

  useEffect(() => {
    if (isError) {
      toast('A server error occurred while getting analytics', {
        type: 'error',
      });
    }
  }, [isError]);

  return (
    <div className="h-screen py-5 overflow-y-hidden">
      <div className="container h-full">
        <Title>Overall session analytics</Title>

        <div className="flex justify-between h-full gap-2 mt-5">
          {isLoading && (
            <div className="w-[750px] flex justify-center">
              <PrimaryClipLoader />
            </div>
          )}

          {overallAnalytics && (
            <div className="flex flex-col gap-5 w-[750px]">
              {overallAnalytics.sessionStatistics && (
                <SessionStatisticsBox
                  statistics={overallAnalytics.sessionStatistics}
                />
              )}
              {overallAnalytics.activityDistributionItems && (
                <div className="h-3/5">
                  <ActivityDistributionBox
                    activityDistributionItems={
                      overallAnalytics.activityDistributionItems
                    }
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-4 max-w-80">
            <LinkBox
              link={`range?from=${startOfDay.toISOString()}&to=${endOfDay.toISOString()}`}
            >
              analytics by days
            </LinkBox>
            <LinkBox
              link={`range?from=${startOfWeek.toISOString()}&to=${endOfWeek.toISOString()}`}
            >
              analytics by weeks
            </LinkBox>
            <LinkBox
              link={`range?from=${startOfMonth.toISOString()}&to=${endOfMonth.toISOString()}`}
            >
              analytics by months
            </LinkBox>
            <LinkBox
              link={`range?from=${startOfYear.toISOString()}&to=${endOfYear.toISOString()}`}
            >
              analytics by years
            </LinkBox>
            <LinkBox
              link={`range?from=${customFromDate.toISOString()}&to=${endOfDay.toISOString()}`}
            >
              Custom range
            </LinkBox>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOverallPage;
