import { FC, useEffect, useState } from 'react';
import axios from '../axios';

import { ISessionStatistics } from '../ts/interfaces/Statistics/ISessionStatistics';

import Title from '../components/Title';
import SessionStatisticsBox from '../components/SessionStatisticsBox';
import LinkBox from '../components/LinkBox';

const AnalyticsPage: FC = () => {
  const currentDayString: string = new Date(Date.now())
    .toISOString()
    .split('T')[0];

  const [overallStatistics, setOverallStatistics] =
    useState<ISessionStatistics>();

  useEffect(() => {
    const fetchOverallStatistics = async () => {
      const { data } = await axios.get('/analytics/overall');
      const statistics: ISessionStatistics = {
        sessionsAmount: data.sessionsAmount,
        spentTimeSeconds: data.spentTimeSeconds,
      };
      setOverallStatistics(statistics);
    };
    fetchOverallStatistics();
  }, []);

  return (
    <div className="h-full mt-5">
      <div className="container">
        <Title>Session statistics</Title>

        <div className="mt-5">
          {overallStatistics && (
            <SessionStatisticsBox statistics={overallStatistics} />
          )}
        </div>

        <div className="flex flex-col gap-4 mt-5 max-w-80">
          <LinkBox link={`days/${currentDayString}`}>analytics by days</LinkBox>
          <LinkBox link={`months/${currentDayString}`}>
            analytics by months
          </LinkBox>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
