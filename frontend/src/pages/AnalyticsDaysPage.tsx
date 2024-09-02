import { FC, useState, useEffect } from 'react';
import axios from '../axios';
import { useParams, useNavigate } from 'react-router-dom';
import { getWeekDays, shiftWeek } from '../helpers/dateHelpers';

import { ISessionStatistics } from '../ts/interfaces/Statistics/ISessionStatistics';

import SessionStatisticsBox from '../components/SessionStatisticsBox';
import DaysOfWeekBox from '../components/DaysOfWeekBox';

const AnalyticsDaysPage: FC = () => {
  const { date: dateParam } = useParams();
  const navigate = useNavigate();

  const [dayStatistics, setDayStatistics] = useState<ISessionStatistics>();
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
    setDayStatistics(statistics);
  };

  const dayClickHandler = (date: Date) => {
    navigate(`/analytics/days/${date.toISOString().split('T')[0]}`);
  };

  const leftArrowClickHandler = () => {
    setDaysOfWeek(shiftWeek(daysOfWeek, false));
  };

  const rightArrowClickHandler = () => {
    setDaysOfWeek(shiftWeek(daysOfWeek, true));
  };

  return (
    <>
      <div className="border-b border-solid border-b-gray-400">
        <div className="flex justify-center pb-5 my-5">
          <DaysOfWeekBox
            dayClickHandler={dayClickHandler}
            leftArrowClickHandler={leftArrowClickHandler}
            rightArrowClickHandler={rightArrowClickHandler}
            daysOfWeek={daysOfWeek}
            currentDay={currentDay}
          />
        </div>
      </div>
      <div className="flex h-full">
        <div className="w-1/2 px-4 border-r border-gray-400 border-solid">
          <div className="mt-5">
            {dayStatistics && (
              <SessionStatisticsBox statistics={dayStatistics} />
            )}
          </div>
        </div>
        <div className="w-1/2 px-4"></div>
      </div>
    </>
  );
};

export default AnalyticsDaysPage;
