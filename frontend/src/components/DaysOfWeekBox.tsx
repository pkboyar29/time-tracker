import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getWeekDays,
  shiftWeek,
  getDayOfWeekName,
  getDayRange,
} from '../helpers/dateHelpers';

import LeftChevronIcon from '../icons/LeftChevronIcon';
import RightChevronIcon from '../icons/RightChevronIcon';

interface DaysOfWeekBoxProps {
  currentDay: Date;
}

const DaysOfWeekBox: FC<DaysOfWeekBoxProps> = ({ currentDay }) => {
  const navigate = useNavigate();
  const today: Date = new Date(Date.now());

  const [daysOfWeek, setDaysOfWeek] = useState<Date[]>([]);

  useEffect(() => {
    setDaysOfWeek(getWeekDays(currentDay));
  }, []);

  const leftArrowClickHandler = () => {
    setDaysOfWeek(shiftWeek(daysOfWeek, false));
  };

  const rightArrowClickHandler = () => {
    setDaysOfWeek(shiftWeek(daysOfWeek, true));
  };

  const dayClickHandler = (date: Date) => {
    const [startOfDay, endOfDay] = getDayRange(date);
    navigate(
      `/analytics/range?from=${startOfDay.toISOString()}&to=${endOfDay.toISOString()}`,
      { replace: true }
    );
  };

  return (
    <div className="flex flex-col items-center gap-3 max-w-[340px] select-none">
      <div className="flex justify-between w-full gap-1 px-4 pb-1">
        <button
          onClick={leftArrowClickHandler}
          className="p-[6px] border border-gray-400 border-solid rounded-md hover:bg-gray-200 transition duration-300"
        >
          <LeftChevronIcon />
        </button>
        <div className="flex items-center justify-center w-full text-lg font-medium transition duration-300 border border-gray-400 border-solid rounded-md hover:bg-gray-200">
          {currentDay.toDateString()}
        </div>
        <button
          onClick={rightArrowClickHandler}
          className="p-[6px] border border-gray-400 border-solid rounded-md hover:bg-gray-200 transition duration-300"
        >
          <RightChevronIcon />
        </button>
      </div>
      <div className="flex gap-1">
        {daysOfWeek.map((dayOfWeek, index) => (
          <div
            onClick={() => dayClickHandler(dayOfWeek)}
            className={`w-12 flex flex-col items-center gap-1 py-1 px-2 rounded-[4px] bg-gray-200 cursor-pointer transition duration-300 hover:bg-slate-300 ${
              currentDay.toDateString() === dayOfWeek.toDateString() &&
              'bg-slate-300'
            } ${
              today.toDateString() === dayOfWeek.toDateString() && 'red-dot'
            }`}
            key={index}
          >
            <div className="text-[13px] font-medium text-gray-500">
              {getDayOfWeekName(dayOfWeek.getDay())}
            </div>
            <div className="text-lg font-semibold">
              {dayOfWeek.getDate().toString().length === 2
                ? dayOfWeek.getDate()
                : `0${dayOfWeek.getDate()}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DaysOfWeekBox;
