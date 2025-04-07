import { FC, useEffect, useState } from 'react';
import axios from '../axios';

import { ISessionStatistics } from '../ts/interfaces/Statistics/ISessionStatistics';
import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';

import Title from '../components/Title';
import SessionStatisticsBox from '../components/SessionStatisticsBox';
import ActivityDistributionBox from '../components/ActivityDistributionBox';
import LinkBox from '../components/LinkBox';

const AnalyticsPage: FC = () => {
  const currentDayString: string = new Date(Date.now())
    .toISOString()
    .split('T')[0];

  const [overallStatistics, setOverallStatistics] =
    useState<ISessionStatistics>();
  const [activityDistribution, setActivityDistribution] =
    useState<IActivityDistribution[]>();

  useEffect(() => {
    const fetchOverallStatistics = async () => {
      const { data } = await axios.get('/analytics/overall');
      const statistics: ISessionStatistics = {
        sessionsAmount: data.sessionsAmount,
        spentTimeSeconds: data.spentTimeSeconds,
      };
      setOverallStatistics(statistics);
      const activityDistribution: IActivityDistribution[] =
        data.activityDistribution;
      setActivityDistribution(activityDistribution);
    };
    fetchOverallStatistics();
  }, []);

  return (
    <div className="h-full py-5 bg-custom">
      <div className="container">
        <Title>Session statistics</Title>

        <div className="flex justify-between mt-5">
          <div className="flex flex-col gap-5 w-[550px]">
            {overallStatistics && (
              <SessionStatisticsBox statistics={overallStatistics} />
            )}
            {activityDistribution && (
              <ActivityDistributionBox
                activityDistribution={activityDistribution}
              />
            )}
          </div>

          <div className="flex flex-col gap-4 max-w-80">
            <LinkBox link={`days/${currentDayString}`}>
              analytics by days
            </LinkBox>
            <LinkBox link={`months/${currentDayString}`}>
              analytics by months
            </LinkBox>
            <LinkBox link={`years/${currentDayString}`}>
              analytics by years
            </LinkBox>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
