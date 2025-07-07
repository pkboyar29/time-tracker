import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOverallAnalytics } from '../api/analyticsApi';
import {
  getDayRange,
  getMonthRange,
  getYearRange,
} from '../helpers/dateHelpers';

import Title from '../components/Title';
import SessionStatisticsBox from '../components/SessionStatisticsBox';
import ActivityDistributionBox from '../components/ActivityDistributionBox';
import LinkBox from '../components/LinkBox';
import AnalyticsRangeModal from '../components/modals/AnalyticsRangeModal';
import { ClipLoader } from 'react-spinners';

const AnalyticsOverallPage: FC = () => {
  const [startOfDay, endOfDay] = getDayRange(new Date());
  const [startOfMonth, endOfMonth] = getMonthRange(new Date());
  const [startOfYear, endOfYear] = getYearRange(new Date());

  const { data: overallAnalytics, isLoading } = useQuery({
    queryKey: ['overallAnalytics'],
    queryFn: fetchOverallAnalytics,
  });

  const [customModal, setCustomModal] = useState<boolean>(false);

  return (
    <>
      {customModal && (
        <AnalyticsRangeModal onCloseModal={() => setCustomModal(false)} />
      )}

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
                link={`range?from=${startOfMonth.toISOString()}&to=${endOfMonth.toISOString()}`}
              >
                analytics by months
              </LinkBox>
              <LinkBox
                link={`range?from=${startOfYear.toISOString()}&to=${endOfYear.toISOString()}`}
              >
                analytics by years
              </LinkBox>
              <button
                onClick={() => setCustomModal(true)}
                className="flex items-center justify-between gap-10 px-8 py-2.5 text-xl font-bold text-white transition duration-300 bg-red-500 cursor-pointer hover:bg-red-700 rounded-2xl"
              >
                Customize analytics range
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsOverallPage;
