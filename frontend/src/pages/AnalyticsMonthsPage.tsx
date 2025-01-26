import { FC, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFiveMonths, shiftFiveMonths } from '../helpers/dateHelpers';
import axios from '../axios';

import { ISessionStatistics } from '../ts/interfaces/Statistics/ISessionStatistics';
import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';

import SessionStatisticsBox from '../components/SessionStatisticsBox';
import ActivityDistributionBox from '../components/ActivityDistributionBox';
import MonthsBox from '../components/MonthsBox';

const AnalyticsMonthsPage: FC = () => {
  const navigate = useNavigate();
  const { date: dateParam } = useParams();

  const [months, setMonths] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const [monthStatistics, setMonthStatistics] = useState<ISessionStatistics>();
  const [monthActivityDistribution, setMonthActivityDistribution] =
    useState<IActivityDistribution[]>();

  const fetchMonthStatistics = async (date: Date) => {
    const { data } = await axios.get(`/analytics/months/${date.toISOString()}`);
    const statistics: ISessionStatistics = {
      sessionsAmount: data.sessionsAmount,
      spentTimeSeconds: data.spentTimeSeconds,
    };

    const activityDistribution: IActivityDistribution[] =
      data.activityDistribution;
    setMonthActivityDistribution(activityDistribution);

    setMonthStatistics(statistics);
  };

  const monthClickHandler = (date: Date) => {
    navigate(`/analytics/months/${date.toISOString().split('T')[0]}`, {
      replace: true,
    });
  };

  const leftArrowClickHandler = () => {
    setMonths(shiftFiveMonths(months, false));
  };

  const rightArrowClickHandler = () => {
    setMonths(shiftFiveMonths(months, true));
  };

  useEffect(() => {
    if (dateParam) {
      const modifiedDateParam: string = dateParam.substring(0, 8) + '01';
      const date: Date = new Date(modifiedDateParam);
      setCurrentMonth(date);
      fetchMonthStatistics(date);
    }
  }, [dateParam]);

  useEffect(() => {
    if (dateParam) {
      const modifiedDateParam: string = dateParam.substring(0, 8) + '01';
      const date: Date = new Date(modifiedDateParam);
      setMonths(getFiveMonths(date));
    }
  }, []);

  return (
    <div className="h-screen bg-custom">
      <div className="flex justify-center py-5 border-b border-solid border-b-gray-400">
        <MonthsBox
          months={months}
          currentMonth={currentMonth}
          monthClickHandler={monthClickHandler}
          leftArrowClickHandler={leftArrowClickHandler}
          rightArrowClickHandler={rightArrowClickHandler}
        />
      </div>

      {monthStatistics?.spentTimeSeconds !== 0 ? (
        <div className="flex h-full">
          <div className="w-1/2 px-4 border-r border-gray-400 border-solid">
            <div className="flex flex-col gap-5 mt-5">
              {monthStatistics && (
                <SessionStatisticsBox statistics={monthStatistics} />
              )}
              {monthActivityDistribution && (
                <ActivityDistributionBox
                  activityDistribution={monthActivityDistribution}
                />
              )}
            </div>
          </div>
          <div className="w-1/2 px-4"></div>
        </div>
      ) : (
        <div className="mt-10 text-2xl font-bold text-center">
          There are no session activity this month
        </div>
      )}
    </div>
  );
};

export default AnalyticsMonthsPage;
