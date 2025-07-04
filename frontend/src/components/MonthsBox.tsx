import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getFiveMonths,
  shiftFiveMonths,
  getMonthRange,
} from '../helpers/dateHelpers';

import LeftChevronIcon from '../icons/LeftChevronIcon';
import RightChevronIcon from '../icons/RightChevronIcon';

interface MonthsBoxProps {
  currentMonth: Date;
}

const MonthsBox: FC<MonthsBoxProps> = ({ currentMonth }) => {
  const navigate = useNavigate();

  const [months, setMonths] = useState<Date[]>([]);

  useEffect(() => {
    setMonths(getFiveMonths(currentMonth));
  }, []);

  const leftArrowClickHandler = () => {
    setMonths(shiftFiveMonths(months, false));
  };

  const rightArrowClickHandler = () => {
    setMonths(shiftFiveMonths(months, true));
  };

  const monthClickHandler = (date: Date) => {
    const [startOfMonth, endOfMonth] = getMonthRange(date);
    navigate(
      `/analytics/range?from=${startOfMonth.toISOString()}&to=${endOfMonth.toISOString()}`,
      {
        replace: true,
      }
    );
  };

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div className="flex gap-1 px-2 pb-1">
        <button
          className="p-[6px] border border-gray-400 border-solid rounded-md hover:bg-gray-200 transition duration-300"
          onClick={leftArrowClickHandler}
        >
          <LeftChevronIcon />
        </button>
        <div className="flex items-center justify-center text-lg font-medium transition duration-300 border border-gray-400 border-solid rounded-md w-52 hover:bg-gray-200">
          {new Date().getMonth() === currentMonth.getMonth() &&
          new Date().getFullYear() === currentMonth.getFullYear()
            ? 'This month'
            : `${currentMonth.getFullYear()} ${new Intl.DateTimeFormat(
                'en-US',
                { month: 'long' }
              ).format(currentMonth)}`}
        </div>
        <button
          className="p-[6px] border border-gray-400 border-solid rounded-md hover:bg-gray-200 transition duration-300"
          onClick={rightArrowClickHandler}
        >
          <RightChevronIcon />
        </button>
      </div>

      <div className="flex gap-3">
        {months.map((month, index) => (
          <div
            key={index}
            className={`w-40 flex flex-col gap-2 py-2.5 px-2 rounded-[5px] transition duration-300 bg-gray-200 cursor-pointer hover:bg-slate-300 ${
              month.getMonth() === currentMonth.getMonth() &&
              month.getFullYear() === currentMonth.getFullYear() &&
              `bg-slate-300`
            }
              ${
                new Date().getMonth() === month.getMonth() &&
                new Date().getFullYear() === month.getFullYear() &&
                'red-dot'
              }`}
            onClick={() => monthClickHandler(month)}
          >
            <div className="text-base text-slate-600">
              {month.getFullYear()}
            </div>
            <div className="text-xl">
              {new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
                month
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthsBox;
