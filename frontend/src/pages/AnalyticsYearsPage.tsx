import { FC, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTwoYears, shiftTwoYears } from '../helpers/dateHelpers';
import axios from '../axios';

import { ISessionStatistics } from '../ts/interfaces/Statistics/ISessionStatistics';
import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';

import SessionStatisticsBox from '../components/SessionStatisticsBox';
import ActivityDistributionBox from '../components/ActivityDistributionBox';
import YearsBox from '../components/YearsBox';

const AnalyticsYearsPage: FC = () => {
  const navigate = useNavigate();
  const { date: dateParam } = useParams();

  const [years, setYears] = useState<Date[]>([]);
  const [currentYear, setCurrentYear] = useState<Date>(new Date());

  const [yearStatistics, setYearStatistics] = useState<ISessionStatistics>();
  const [yearActivityDistribution, setYearActivityDistribution] =
    useState<IActivityDistribution[]>();

  const fetchYearStatistics = async (date: Date) => {
    const { data } = await axios.get(`/analytics/years/${date.toISOString()}`);
    const statistics: ISessionStatistics = {
      sessionsAmount: data.sessionsAmount,
      spentTimeSeconds: data.spentTimeSeconds,
    };

    const activityDistribution: IActivityDistribution[] =
      data.activityDistribution;
    setYearActivityDistribution(activityDistribution);

    setYearStatistics(statistics);
  };

  const yearClickHandler = (date: Date) => {
    navigate(`/analytics/years/${date.toISOString().split('T')[0]}`, {
      replace: true,
    });
  };

  const leftArrowClickHandler = () => {
    setYears(shiftTwoYears(years, false));
  };

  const rightArrowClickHandler = () => {
    setYears(shiftTwoYears(years, true));
  };

  useEffect(() => {
    if (dateParam) {
      const modifiedDateParam: string = dateParam.substring(0, 8) + '01';
      const date: Date = new Date(modifiedDateParam);
      setCurrentYear(date);
      fetchYearStatistics(date);
    }
  }, [dateParam]);

  useEffect(() => {
    if (dateParam) {
      const modifiedDateParam: string = dateParam.substring(0, 8) + '01';
      const date: Date = new Date(modifiedDateParam);

      setYears(getTwoYears(date));
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-custom">
      <div className="flex justify-center py-5 border-b border-solid border-b-gray-400">
        <YearsBox
          years={years}
          currentYear={currentYear}
          yearClickHandler={yearClickHandler}
          leftArrowClickHandler={leftArrowClickHandler}
          rightArrowClickHandler={rightArrowClickHandler}
        />
      </div>

      {yearStatistics?.spentTimeSeconds !== 0 ? (
        <div className="flex flex-1">
          <div className="w-1/2 px-4 border-r border-gray-400 border-solid">
            <div className="flex flex-col gap-5 mt-5">
              {yearStatistics && (
                <SessionStatisticsBox statistics={yearStatistics} />
              )}
              {yearActivityDistribution && (
                <ActivityDistributionBox
                  activityDistribution={yearActivityDistribution}
                />
              )}
            </div>
          </div>
          <div className="w-1/2 px-4"></div>
        </div>
      ) : (
        <div className="mt-10 text-2xl font-bold text-center">
          There are no session activity this year
        </div>
      )}
    </div>
  );
};

export default AnalyticsYearsPage;
