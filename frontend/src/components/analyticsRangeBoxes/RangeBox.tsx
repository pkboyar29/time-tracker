import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getWeekDays,
  shiftWeekDays,
  getDayOfWeekName,
  getDayRange,
  getMonthWeeks,
  getMonthName,
  getFiveMonths,
  shiftFiveMonths,
  getMonthRange,
  getTwoYears,
  shiftTwoYears,
  getYearRange,
  isCurrentDay,
  isCurrentWeek,
  isCurrentMonth,
  isCurrentYear,
} from '../../helpers/dateHelpers';
import { RangeType } from '../../helpers/dateHelpers';

import LeftChevronIcon from '../../icons/LeftChevronIcon';
import RightChevronIcon from '../../icons/RightChevronIcon';

interface RangeBoxProps {
  rangeType: RangeType;
  fromDate: Date;
  toDate: Date;
}

const isDateDay = (
  rangeType: RangeType,
  date: Date | [Date, Date]
): date is Date => rangeType == 'days' && date instanceof Date;
const isDateWeek = (
  rangeType: RangeType,
  date: Date | [Date, Date]
): date is [Date, Date] => rangeType == 'weeks' && Array.isArray(date);
const isDateMonth = (
  rangeType: RangeType,
  date: Date | [Date, Date]
): date is Date => rangeType == 'months' && date instanceof Date;
const isDateYear = (
  rangeType: RangeType,
  date: Date | [Date, Date]
): date is Date => rangeType == 'years' && date instanceof Date;

const getRangeItems = (
  rangeType: RangeType,
  fromDate: Date
): Date[] | [Date, Date][] => {
  switch (rangeType) {
    case 'days':
      return getWeekDays(fromDate);
    case 'weeks':
      return getMonthWeeks(fromDate);
    case 'months':
      return getFiveMonths(fromDate);
    case 'years':
      return getTwoYears(fromDate);
    default:
      return [];
  }
};

const isRangeItemSelected = (
  rangeType: RangeType,
  fromDate: Date,
  rangeItemDate: Date | [Date, Date]
): boolean => {
  if (isDateDay(rangeType, rangeItemDate)) {
    return (
      fromDate.getDate() == rangeItemDate.getDate() &&
      fromDate.getMonth() == rangeItemDate.getMonth() &&
      fromDate.getFullYear() == rangeItemDate.getFullYear()
    );
  }
  if (isDateMonth(rangeType, rangeItemDate)) {
    return (
      fromDate.getMonth() == rangeItemDate.getMonth() &&
      fromDate.getFullYear() == rangeItemDate.getFullYear()
    );
  }
  if (isDateYear(rangeType, rangeItemDate)) {
    return fromDate.getFullYear() == rangeItemDate.getFullYear();
  }
  if (isDateWeek(rangeType, rangeItemDate)) {
    return (
      fromDate.getTime() >= rangeItemDate[0].getTime() &&
      fromDate.getTime() < rangeItemDate[1].getTime()
    );
  }

  return false;
};

const isCurrentRangeItem = (
  rangeType: RangeType,
  rangeItemDate: Date | [Date, Date]
): boolean => {
  if (isDateDay(rangeType, rangeItemDate)) {
    return isCurrentDay(rangeItemDate);
  }
  if (isDateWeek(rangeType, rangeItemDate)) {
    return isCurrentWeek(rangeItemDate);
  }
  if (isDateMonth(rangeType, rangeItemDate)) {
    return isCurrentMonth(rangeItemDate);
  }
  if (isDateYear(rangeType, rangeItemDate)) {
    return isCurrentYear(rangeItemDate);
  }

  return false;
};

const renderWeekLabel = (week: Date[]) => (
  <div className="flex gap-1.5 text-lg dark:text-textDark">
    <time>
      {getMonthName(week[0].getMonth())} {week[0].getDate()}
    </time>
    <span>-</span>
    <time>
      {getMonthName(week[1].getMonth())} {week[1].getDate()}
    </time>
  </div>
);

const renderDateLabel = (
  rangeType: RangeType,
  fromDate: Date,
  toDate: Date
) => {
  if (rangeType == 'days') {
    return <>{isCurrentDay(fromDate) ? 'Today' : fromDate.toDateString()}</>;
  } else if (rangeType == 'weeks') {
    return (
      <>
        {isCurrentWeek([fromDate, toDate]) ? (
          <>This week</>
        ) : (
          renderWeekLabel([fromDate, toDate])
        )}
      </>
    );
  } else if (rangeType == 'months') {
    return (
      <>
        {isCurrentMonth(fromDate)
          ? 'This month'
          : `${fromDate.getFullYear()} ${new Intl.DateTimeFormat('en-US', {
              month: 'long',
            }).format(fromDate)}`}
      </>
    );
  } else if (rangeType == 'years') {
    return (
      <>{isCurrentYear(fromDate) ? 'This year' : fromDate.getFullYear()}</>
    );
  }
};

const RangeBox: FC<RangeBoxProps> = ({ rangeType, fromDate, toDate }) => {
  const navigate = useNavigate();

  const rangeItemClassNames = `transition duration-300 cursor-pointer bg-gray-200 dark:bg-surfaceDark hover:bg-gray-300 dark:hover:bg-surfaceDarkHover px-2 ${
    rangeType === 'days'
      ? 'w-12 rounded-[4px] items-center gap-1 py-1'
      : 'w-40 rounded-[5px] py-2.5'
  } ${rangeType !== 'weeks' && 'flex flex-col'} ${
    rangeType === 'years' && 'gap-2'
  }`;

  const [rangeItems, setRangeItems] = useState<Date[] | [Date, Date][]>(
    getRangeItems(rangeType, fromDate)
  );

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

  // TODO: избавиться от type assertion
  const leftArrowClickHandler = () => {
    if (rangeType == 'days') {
      setRangeItems((daysOfWeek) => shiftWeekDays(daysOfWeek as Date[], false));
    } else if (rangeType == 'weeks') {
      setRangeItems((weeks) => {
        // первое воскресенье всегда находится в текущем месяце
        const firstSunday = (weeks as [Date, Date][])[0][1];

        // выбираем четвертый день в предыдущем месяце
        const dayFromPrevMonth = new Date(firstSunday);
        dayFromPrevMonth.setMonth(dayFromPrevMonth.getMonth() - 1);
        dayFromPrevMonth.setDate(4);

        return getMonthWeeks(dayFromPrevMonth);
      });
    } else if (rangeType == 'months') {
      setRangeItems((months) => shiftFiveMonths(months as Date[], false));
    } else if (rangeType == 'years') {
      setRangeItems((years) => shiftTwoYears(years as Date[], false));
    }
  };

  // TODO: избавиться от type assertion
  const rightArrowClickHandler = () => {
    if (rangeType == 'days') {
      setRangeItems((daysOfWeek) => shiftWeekDays(daysOfWeek as Date[], true));
    } else if (rangeType == 'weeks') {
      setRangeItems((weeks) => {
        // последний понедельник всегда находится в текущем месяце
        const lastMonday = (weeks as [Date, Date][])[weeks.length - 1][0];

        // выбираем четвертый день в следующем месяце
        const dayFromNextMonth = new Date(lastMonday);
        dayFromNextMonth.setMonth(dayFromNextMonth.getMonth() + 1);
        dayFromNextMonth.setDate(4);

        return getMonthWeeks(dayFromNextMonth);
      });
    } else if (rangeType == 'months') {
      setRangeItems((months) => shiftFiveMonths(months as Date[], true));
    } else if (rangeType == 'years') {
      setRangeItems((years) => shiftTwoYears(years as Date[], true));
    }
  };

  const rangeItemClickHandler = (date: Date | [Date, Date]) => {
    if (isDateDay(rangeType, date)) {
      const [startOfDay, endOfDay] = getDayRange(date);
      navigate(
        `/analytics/range?from=${startOfDay.toISOString()}&to=${endOfDay.toISOString()}`,
        { replace: true }
      );
    } else if (isDateWeek(rangeType, date)) {
      navigate(
        `/analytics/range?from=${date[0].toISOString()}&to=${date[1].toISOString()}`,
        {
          replace: true,
        }
      );
    } else if (isDateMonth(rangeType, date)) {
      const [startOfMonth, endOfMonth] = getMonthRange(date);
      navigate(
        `/analytics/range?from=${startOfMonth.toISOString()}&to=${endOfMonth.toISOString()}`,
        {
          replace: true,
        }
      );
    } else if (isDateYear(rangeType, date)) {
      const [startOfYear, endOfYear] = getYearRange(date);
      navigate(
        `/analytics/range?from=${startOfYear.toISOString()}&to=${endOfYear.toISOString()}`,
        {
          replace: true,
        }
      );
    }
  };

  return (
    <div
      className={`flex flex-col items-center gap-3 select-none ${
        rangeType === 'days' && 'max-w-[340px]'
      }`}
    >
      <div className="flex gap-1 px-2 pb-1">
        <button
          className="rounded-md p-[6px] border border-solid border-gray-400 dark:border-gray-500 transition duration-300 hover:bg-gray-200 dark:hover:bg-backgroundDarkHover"
          onClick={leftArrowClickHandler}
        >
          <LeftChevronIcon />
        </button>

        <div className="flex items-center justify-center text-lg font-medium transition duration-300 border border-gray-400 border-solid rounded-md dark:border-gray-500 w-52 hover:bg-gray-200 dark:hover:bg-backgroundDarkHover dark:text-textDark">
          {renderDateLabel(rangeType, fromDate, toDate)}
        </div>

        <button
          className="rounded-md p-[6px] border border-solid border-gray-400 dark:border-gray-500 transition duration-300 hover:bg-gray-200 dark:hover:bg-backgroundDarkHover"
          onClick={rightArrowClickHandler}
        >
          <RightChevronIcon />
        </button>
      </div>

      <div className={`flex ${rangeType === 'days' ? 'gap-1' : 'gap-3'}`}>
        {rangeItems.map((rangeItem, index) => (
          <div
            key={index}
            onClick={() => rangeItemClickHandler(rangeItem)}
            className={`${rangeItemClassNames} ${
              isRangeItemSelected(rangeType, fromDate, rangeItem) &&
              'bg-gray-300 dark:bg-surfaceDarkHover'
            } ${isCurrentRangeItem(rangeType, rangeItem) && 'red-dot'}`}
          >
            {isDateDay(rangeType, rangeItem) && (
              <>
                <div className="text-[13px] font-medium text-gray-500 dark:text-textDarkSecondary">
                  {getDayOfWeekName(rangeItem.getDay())}
                </div>

                <div className="text-lg font-semibold dark:text-textDark">
                  {rangeItem.getDate().toString().length === 2
                    ? rangeItem.getDate()
                    : `0${rangeItem.getDate()}`}
                </div>
              </>
            )}

            {isDateWeek(rangeType, rangeItem) && (
              <>
                <div className="text-base text-left text-slate-600 dark:text-textDarkSecondary">
                  {rangeItem[0].getFullYear() == rangeItem[1].getFullYear() ? (
                    <>{rangeItem[0].getFullYear()}</>
                  ) : (
                    <>
                      {rangeItem[0].getFullYear()}/{rangeItem[1].getFullYear()}
                    </>
                  )}
                </div>

                {renderWeekLabel(rangeItem)}
              </>
            )}

            {isDateMonth(rangeType, rangeItem) && (
              <>
                <div className="text-base text-slate-600 dark:text-textDarkSecondary">
                  {rangeItem.getFullYear()}
                </div>
                <div className="text-xl dark:text-textDark">
                  {new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
                    rangeItem
                  )}
                </div>
              </>
            )}

            {isDateYear(rangeType, rangeItem) && (
              <div className="text-xl text-center dark:text-textDark">
                {rangeItem.getFullYear()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RangeBox;
