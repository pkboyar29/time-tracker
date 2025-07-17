import { FC, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { ClipLoader } from 'react-spinners';

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
  } = useQuery({
    queryKey: ['overallAnalytics'],
    queryFn: fetchOverallAnalytics,
    retry: false,
  });

  useEffect(() => {
    if (isError) {
      toast('A server error occurred while getting analytics', {
        type: 'error',
      });
    }
  }, [isError]);

  return (
    <div className="h-screen py-5 overflow-y-hidden bg-custom">
      <div className="container h-full">
        <Title>Session statistics</Title>

        <div className="flex justify-between h-full gap-2 mt-5">
          {isLoading && (
            <div className="w-[750px] flex justify-center">
              <ClipLoader color="#EF4444" />
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
