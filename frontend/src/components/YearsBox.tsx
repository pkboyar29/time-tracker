import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTwoYears,
  shiftTwoYears,
  getYearRange,
} from '../helpers/dateHelpers';

import LeftChevronIcon from '../icons/LeftChevronIcon';
import RightChevronIcon from '../icons/RightChevronIcon';

interface YearsBoxProps {
  currentYear: Date;
}

const YearsBox: FC<YearsBoxProps> = ({ currentYear }) => {
  const navigate = useNavigate();

  const [years, setYears] = useState<Date[]>([]);

  useEffect(() => {
    setYears(getTwoYears(currentYear));
  }, []);

  const leftArrowClickHandler = () => {
    setYears(shiftTwoYears(years, false));
  };

  const rightArrowClickHandler = () => {
    setYears(shiftTwoYears(years, true));
  };

  const yearClickHandler = (date: Date) => {
    const [startOfYear, endOfYear] = getYearRange(date);
    navigate(
      `/analytics/range?from=${startOfYear.toISOString()}&to=${endOfYear.toISOString()}`,
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
          {new Date().getFullYear() === currentYear.getFullYear()
            ? 'This year'
            : currentYear.getFullYear()}
        </div>
        <button
          className="p-[6px] border border-gray-400 border-solid rounded-md hover:bg-gray-200 transition duration-300"
          onClick={rightArrowClickHandler}
        >
          <RightChevronIcon />
        </button>
      </div>

      <div className="flex gap-3">
        {years.map((yearDate, index) => (
          <div
            key={index}
            className={`w-40 flex flex-col gap-2 py-2.5 px-2 rounded-[5px] transition duration-300 bg-gray-200 cursor-pointer hover:bg-slate-300 ${
              yearDate.getFullYear() === currentYear.getFullYear() &&
              `bg-slate-300`
            }
              ${
                new Date().getFullYear() === yearDate.getFullYear() && 'red-dot'
              }`}
            onClick={() => yearClickHandler(yearDate)}
          >
            <div className="text-xl text-center"> {yearDate.getFullYear()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default YearsBox;
