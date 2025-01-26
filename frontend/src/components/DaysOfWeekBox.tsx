import { FC } from 'react';
import { getDayOfWeekName } from '../helpers/dateHelpers';

import LeftArrowIcon from '../icons/LeftArrowIcon';
import RightArrowIcon from '../icons/RightArrowIcon';

interface DaysOfWeekBoxProps {
  daysOfWeek: Date[];
  currentDay: Date;
  dayClickHandler: (date: Date) => void;
  leftArrowClickHandler: () => void;
  rightArrowClickHandler: () => void;
}

const DaysOfWeekBox: FC<DaysOfWeekBoxProps> = ({
  daysOfWeek,
  currentDay,
  dayClickHandler,
  leftArrowClickHandler,
  rightArrowClickHandler,
}) => {
  const today: Date = new Date(Date.now());

  return (
    <div className="flex flex-col items-center gap-3 max-w-[340px] select-none">
      <div className="flex justify-between w-full gap-1 px-4 pb-1">
        <button
          onClick={leftArrowClickHandler}
          className="p-[6px] border border-gray-400 border-solid rounded-md hover:bg-gray-200 transition duration-300"
        >
          <LeftArrowIcon />
        </button>
        <div className="flex items-center justify-center w-full text-lg font-medium transition duration-300 border border-gray-400 border-solid rounded-md hover:bg-gray-200">
          {currentDay.toDateString()}
        </div>
        <button
          onClick={rightArrowClickHandler}
          className="p-[6px] border border-gray-400 border-solid rounded-md hover:bg-gray-200 transition duration-300"
        >
          <RightArrowIcon />
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
