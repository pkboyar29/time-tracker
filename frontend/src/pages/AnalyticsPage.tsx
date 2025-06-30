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
  const [activityDistributionItems, setActivityDistributionItems] =
    useState<IActivityDistribution[]>();

  useEffect(() => {
    const fetchOverallStatistics = async () => {
      const { data } = await axios.get(
        `/analytics/?from=2000-01-01T00:00:00&to=${new Date(
          Date.now()
        ).toISOString()}`
      );

      const statistics: ISessionStatistics = {
        sessionsAmount: data.sessionsAmount,
        spentTimeSeconds: data.spentTimeSeconds,
      };
      setOverallStatistics(statistics);
      const activityDistributionItems: IActivityDistribution[] =
        data.activityDistribution;
      setActivityDistributionItems([...activityDistributionItems]);
    };
    fetchOverallStatistics();
  }, []);

  return (
    <div className="h-screen py-5 overflow-y-hidden bg-custom">
      <div className="container h-full">
        <Title>Session statistics</Title>

        <div className="flex justify-between h-full mt-5">
          <div className="flex flex-col gap-5 w-[550px]">
            {overallStatistics && (
              <SessionStatisticsBox statistics={overallStatistics} />
            )}
            {activityDistributionItems && (
              <div className="h-3/5">
                <ActivityDistributionBox
                  activityDistributionItems={activityDistributionItems}
                />
              </div>
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
