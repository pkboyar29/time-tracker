import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getFiveMonths,
  shiftFiveMonths,
  getMonthRange,
} from '../../helpers/dateHelpers';

import LeftChevronIcon from '../../icons/LeftChevronIcon';
import RightChevronIcon from '../../icons/RightChevronIcon';

interface MonthsBoxProps {
  currentMonth: Date;
}

const isMonthCurrent = (monthDate: Date): boolean => {
  return (
    new Date().getMonth() == monthDate.getMonth() &&
    new Date().getFullYear() == monthDate.getFullYear()
  );
};

const MonthsBox: FC<MonthsBoxProps> = ({ currentMonth }) => {
  const navigate = useNavigate();

  const [months, setMonths] = useState<Date[]>(getFiveMonths(currentMonth));

  useEffect(() => {
    const handleKeyClick = (event: KeyboardEvent) => {
      if (event.code == 'ArrowLeft') {
        leftArrowClickHandler();
      } else if (event.code == 'ArrowRight') {
        rightArrowClickHandler();
      }
    };

    window.addEventListener('keyup', handleKeyClick);

    return () => {
      window.removeEventListener('keyup', handleKeyClick);
    };
  }, []);

  const leftArrowClickHandler = () => {
    setMonths((months) => shiftFiveMonths(months, false));
  };

  const rightArrowClickHandler = () => {
    setMonths((months) => shiftFiveMonths(months, true));
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
          className="rounded-md p-[6px] border border-solid border-gray-400 dark:border-gray-500 transition duration-300 hover:bg-gray-200 dark:hover:bg-backgroundDarkHover"
          onClick={leftArrowClickHandler}
        >
          <LeftChevronIcon />
        </button>

        <div className="flex items-center justify-center text-lg font-medium transition duration-300 border border-gray-400 border-solid rounded-md dark:border-gray-500 w-52 hover:bg-gray-200 dark:hover:bg-backgroundDarkHover dark:text-textDark">
          {isMonthCurrent(currentMonth)
            ? 'This month'
            : `${currentMonth.getFullYear()} ${new Intl.DateTimeFormat(
                'en-US',
                { month: 'long' }
              ).format(currentMonth)}`}
        </div>

        <button
          className="rounded-md p-[6px] border border-solid border-gray-400 dark:border-gray-500 transition duration-300 hover:bg-gray-200 dark:hover:bg-backgroundDarkHover"
          onClick={rightArrowClickHandler}
        >
          <RightChevronIcon />
        </button>
      </div>

      <div className="flex gap-3">
        {months.map((month, index) => (
          <div
            key={index}
            className={`w-40 flex flex-col py-2.5 px-2 rounded-[5px] transition duration-300 bg-gray-200 dark:bg-surfaceDark cursor-pointer hover:bg-gray-300 dark:hover:bg-surfaceDarkHover ${
              month.getMonth() == currentMonth.getMonth() &&
              month.getFullYear() == currentMonth.getFullYear() &&
              `bg-gray-300 dark:bg-surfaceDarkHover`
            } ${isMonthCurrent(month) && `red-dot`}`}
            onClick={() => monthClickHandler(month)}
          >
            <div className="text-base text-slate-600 dark:text-textDarkSecondary">
              {month.getFullYear()}
            </div>
            <div className="text-xl dark:text-textDark">
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
