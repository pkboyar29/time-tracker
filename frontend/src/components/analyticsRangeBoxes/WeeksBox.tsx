import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMonthWeeks, getMonthName } from '../../helpers/dateHelpers';

import LeftChevronIcon from '../../icons/LeftChevronIcon';
import RightChevronIcon from '../../icons/RightChevronIcon';

const isWeekCurrent = (week: [Date, Date]): boolean => {
  const now = new Date();

  return now.getTime() > week[0].getTime() && now.getTime() < week[1].getTime();
};

interface WeeksBoxProps {
  fromDate: Date;
  toDate: Date;
}

const WeeksBox: FC<WeeksBoxProps> = ({ fromDate, toDate }) => {
  const navigate = useNavigate();

  const [weeks, setWeeks] = useState<Date[][]>(getMonthWeeks(fromDate));

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
    setWeeks((weeks) => {
      // первое воскресенье всегда находится в текущем месяце
      const firstSunday = weeks[0][1];

      // выбираем четвертый день в предыдущем месяце
      const dayFromPrevMonth = new Date(firstSunday);
      dayFromPrevMonth.setMonth(dayFromPrevMonth.getMonth() - 1);
      dayFromPrevMonth.setDate(4);

      return getMonthWeeks(dayFromPrevMonth);
    });
  };

  const rightArrowClickHandler = () => {
    setWeeks((weeks) => {
      // последний понедельник всегда находится в текущем месяце
      const lastMonday = weeks[weeks.length - 1][0];

      // выбираем четвертый день в следующем месяце
      const dayFromNextMonth = new Date(lastMonday);
      dayFromNextMonth.setMonth(dayFromNextMonth.getMonth() + 1);
      dayFromNextMonth.setDate(4);

      return getMonthWeeks(dayFromNextMonth);
    });
  };

  const weekClickHandler = (week: Date[]) => {
    navigate(
      `/analytics/range?from=${week[0].toISOString()}&to=${week[1].toISOString()}`,
      {
        replace: true,
      }
    );
  };

  const renderWeekText = (week: Date[]) => (
    <div className="flex gap-1.5 text-lg">
      <time>
        {getMonthName(week[0].getMonth())} {week[0].getDate()}
      </time>
      <span>-</span>
      <time>
        {getMonthName(week[1].getMonth())} {week[1].getDate()}
      </time>
    </div>
  );

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
          {isWeekCurrent([fromDate, toDate]) ? (
            <>This week</>
          ) : (
            renderWeekText([fromDate, toDate])
          )}
        </div>

        <button
          className="p-[6px] border border-gray-400 border-solid rounded-md hover:bg-gray-200 transition duration-300"
          onClick={rightArrowClickHandler}
        >
          <RightChevronIcon />
        </button>
      </div>

      <div className="flex gap-3">
        {weeks.map((week, index) => (
          <div
            key={index}
            className={`w-40 bg-gray-200 hover:bg-gray-300 py-2.5 px-2 rounded-[5px] cursor-pointer transition duration-300 ${
              isWeekCurrent([week[0], week[1]]) && 'red-dot'
            } ${
              fromDate.getTime() >= week[0].getTime() &&
              fromDate.getTime() < week[1].getTime() &&
              'bg-gray-300'
            }`}
            onClick={() => weekClickHandler(week)}
          >
            <div className="text-base text-left text-slate-600">
              {week[0].getFullYear() == week[1].getFullYear() ? (
                <>{week[0].getFullYear()}</>
              ) : (
                <>
                  {week[0].getFullYear()}/{week[1].getFullYear()}
                </>
              )}
            </div>

            {renderWeekText(week)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeksBox;
