import { FC, useState, useEffect } from 'react';
import axios from '../axios';
import { useParams, useNavigate } from 'react-router-dom';
import { getWeekDays, shiftWeek } from '../helpers/dateHelpers';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

import { ISessionStatistics } from '../ts/interfaces/Statistics/ISessionStatistics';
import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';

import SessionStatisticsBox from '../components/SessionStatisticsBox';
import DailyGoalBox from '../components/DailyGoalBox';
import ActivityDistributionBox from '../components/ActivityDistributionBox';
import DaysOfWeekBox from '../components/DaysOfWeekBox';

const AnalyticsDaysPage: FC = () => {
  const { date: dateParam } = useParams();
  const navigate = useNavigate();

  const userInfo = useSelector((state: RootState) => state.users.user);

  const [dayStatistics, setDayStatistics] = useState<ISessionStatistics>();
  const [dayActivityDistribution, setDayActivityDistribution] =
    useState<IActivityDistribution[]>();
  const [daysOfWeek, setDaysOfWeek] = useState<Date[]>([]);
  const [currentDay, setCurrentDay] = useState<Date>(new Date());

  useEffect(() => {
    if (dateParam) {
      setCurrentDay(new Date(dateParam));
      fetchDayStatistics(new Date(dateParam));
    }
  }, [dateParam]);

  useEffect(() => {
    if (dateParam) {
      setDaysOfWeek(getWeekDays(new Date(dateParam)));
    }
  }, []);

  const fetchDayStatistics = async (date: Date) => {
    const { data } = await axios.get(`/analytics/days/${date.toISOString()}`);
    const statistics: ISessionStatistics = {
      sessionsAmount: data.sessionsAmount,
      spentTimeSeconds: data.spentTimeSeconds,
    };
    const activityDistribution: IActivityDistribution[] =
      data.activityDistribution;
    setDayActivityDistribution([...activityDistribution]);

    setDayStatistics(statistics);
  };

  const dayClickHandler = (date: Date) => {
    navigate(`/analytics/days/${date.toISOString().split('T')[0]}`, {
      replace: true,
    });
  };

  const leftArrowClickHandler = () => {
    setDaysOfWeek(shiftWeek(daysOfWeek, false));
  };

  const rightArrowClickHandler = () => {
    setDaysOfWeek(shiftWeek(daysOfWeek, true));
  };

  return (
    <div className="flex flex-col h-screen overflow-y-hidden bg-custom">
      <div className="flex justify-center py-5 border-b border-solid border-b-gray-400">
        <DaysOfWeekBox
          dayClickHandler={dayClickHandler}
          leftArrowClickHandler={leftArrowClickHandler}
          rightArrowClickHandler={rightArrowClickHandler}
          daysOfWeek={daysOfWeek}
          currentDay={currentDay}
        />
      </div>

      {dayStatistics?.spentTimeSeconds !== 0 ? (
        <div className="flex h-full">
          <div className="flex flex-col w-1/2 h-full gap-5 px-4 pt-5 border-r border-gray-400 border-solid">
            {dayStatistics && (
              <SessionStatisticsBox statistics={dayStatistics} />
            )}
            {dayActivityDistribution && (
              <div className="overflow-y-auto basis-3/5">
                <ActivityDistributionBox
                  activityDistributionItems={dayActivityDistribution}
                />
              </div>
            )}
          </div>
          <div className="w-1/2 px-4">
            <div className="mt-5">
              {dayStatistics && userInfo && (
                <DailyGoalBox
                  spentTimeSeconds={dayStatistics.spentTimeSeconds}
                  dailyGoalSeconds={userInfo.dailyGoal}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-10 text-2xl font-bold text-center">
          There are no session activity on this day
        </div>
      )}
    </div>
  );
};

export default AnalyticsDaysPage;
