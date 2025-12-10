import { FC, useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useDebounce } from '../../hooks/useDebounce';
import {
  getWeekDays,
  shiftWeekDays,
  getDayOfWeekName,
  getWeeks,
  getMonthName,
  getMonths,
  shiftMonths,
  getYears,
  shiftYears,
  isCurrentDay,
  isCurrentWeek,
  isCurrentMonth,
  isCurrentYear,
  shiftTwoDates,
  getRangeType,
} from '../../helpers/dateHelpers';
import { RangeType } from '../../helpers/dateHelpers';

import LeftChevronIcon from '../../icons/LeftChevronIcon';
import RightChevronIcon from '../../icons/RightChevronIcon';

interface RangeBoxProps {
  range: { fromDate: Date; toDate: Date };
}

const getRangeItems = (
  rangeType: RangeType,
  fromDate: Date,
  windowWidth: number
): [Date, Date][] => {
  switch (rangeType) {
    case 'days':
      return getWeekDays(fromDate);
    case 'weeks':
      return getWeeks(fromDate, windowWidth >= 768);
    case 'months':
      return getMonths(fromDate, windowWidth >= 768);
    case 'years':
      return getYears(fromDate);
    default:
      return [];
  }
};

const isRangeItemSelected = (
  rangeType: RangeType,
  fromDate: Date,
  rangeItemDate: [Date, Date]
): boolean => {
  if (rangeType == 'days') {
    return (
      fromDate.getDate() == rangeItemDate[0].getDate() &&
      fromDate.getMonth() == rangeItemDate[0].getMonth() &&
      fromDate.getFullYear() == rangeItemDate[0].getFullYear()
    );
  }
  if (rangeType == 'weeks') {
    return (
      fromDate.getTime() >= rangeItemDate[0].getTime() &&
      fromDate.getTime() < rangeItemDate[1].getTime()
    );
  }
  if (rangeType == 'months') {
    return (
      fromDate.getMonth() == rangeItemDate[0].getMonth() &&
      fromDate.getFullYear() == rangeItemDate[0].getFullYear()
    );
  }
  if (rangeType == 'years') {
    return fromDate.getFullYear() == rangeItemDate[0].getFullYear();
  }

  return false;
};

const isCurrentRangeItem = (
  rangeType: RangeType,
  rangeItemDate: [Date, Date]
): boolean => {
  if (rangeType == 'days') {
    return isCurrentDay(rangeItemDate[0]);
  }
  if (rangeType == 'weeks') {
    return isCurrentWeek(rangeItemDate);
  }
  if (rangeType == 'months') {
    return isCurrentMonth(rangeItemDate[0]);
  }
  if (rangeType == 'years') {
    return isCurrentYear(rangeItemDate[0]);
  }

  return false;
};

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
          <div className="flex gap-1.5 text-lg dark:text-textDark">
            <time>
              {getMonthName(fromDate.getMonth())} {fromDate.getDate()}
            </time>
            <span>-</span>
            <time>
              {getMonthName(toDate.getMonth())} {toDate.getDate()}
            </time>
          </div>
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

const RangeBox: FC<RangeBoxProps> = ({ range }) => {
  const { width: windowWidth } = useWindowSize();
  const debouncedWidth = useDebounce(windowWidth, 150);
  const navigate = useNavigate();

  const rangeType = getRangeType(range.fromDate, range.toDate);

  const rangeItemClassNames = `transition duration-300 cursor-pointer bg-gray-200 dark:bg-surfaceDark hover:bg-gray-300 dark:hover:bg-surfaceDarkHover px-2 ${
    rangeType === 'days'
      ? 'w-12 rounded-[4px] items-center gap-1 py-1'
      : 'w-36 lg:w-40 rounded-[5px] py-2.5'
  } ${rangeType !== 'weeks' && 'flex flex-col'} ${
    rangeType === 'years' && 'gap-2'
  }`;

  const [rangeItems, setRangeItems] = useState<[Date, Date][]>(() =>
    getRangeItems(rangeType, range.fromDate, windowWidth)
  );

  useLayoutEffect(() => {
    setRangeItems(getRangeItems(rangeType, range.fromDate, windowWidth));
  }, [rangeType]);

  useEffect(() => {
    setRangeItems(getRangeItems(rangeType, range.fromDate, debouncedWidth));
  }, [debouncedWidth]);

  useEffect(() => {
    const handleKeyClick = (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        if (event.code == 'ArrowLeft') {
          leftArrowClickHandler();
        } else if (event.code == 'ArrowRight') {
          rightArrowClickHandler();
        }
      } else {
        if (event.code == 'ArrowLeft') {
          const [newFromDate, newToDate] = shiftTwoDates(
            range.fromDate,
            range.toDate,
            false
          );
          navigate(
            `/analytics/range?from=${newFromDate.toISOString()}&to=${newToDate.toISOString()}`,
            { replace: true }
          );

          const index = rangeItems.findIndex(
            (rangeItem) =>
              rangeItem[0].getTime() == range.fromDate.getTime() &&
              rangeItem[1].getTime() == range.toDate.getTime()
          );
          if (index == 0) {
            leftArrowClickHandler();
          }
          if (index == -1) {
            setRangeItems(getRangeItems(rangeType, newFromDate, windowWidth));
          }
        } else if (event.code == 'ArrowRight') {
          const [newFromDate, newToDate] = shiftTwoDates(
            range.fromDate,
            range.toDate,
            true
          );
          navigate(
            `/analytics/range?from=${newFromDate.toISOString()}&to=${newToDate.toISOString()}`,
            { replace: true }
          );

          const index = rangeItems.findIndex(
            (rangeItem) =>
              rangeItem[0].getTime() == range.fromDate.getTime() &&
              rangeItem[1].getTime() == range.toDate.getTime()
          );
          if (index == rangeItems.length - 1) {
            rightArrowClickHandler();
          }
          if (index == -1) {
            setRangeItems(getRangeItems(rangeType, newFromDate, windowWidth));
          }
        }
      }
    };

    window.addEventListener('keyup', handleKeyClick);

    return () => {
      window.removeEventListener('keyup', handleKeyClick);
    };
  }, [rangeItems, rangeType, range.fromDate, range.toDate]);

  function leftArrowClickHandler() {
    if (rangeType == 'days') {
      setRangeItems((daysOfWeek) => shiftWeekDays(daysOfWeek, false));
    } else if (rangeType == 'weeks') {
      setRangeItems((weeks) => {
        const full = windowWidth >= 768;

        if (full) {
          // первое воскресенье всегда находится в текущем месяце
          const firstSunday = weeks[0][1];

          // выбираем четвертый день в предыдущем месяце
          const dayFromPrevMonth = new Date(firstSunday);
          dayFromPrevMonth.setMonth(dayFromPrevMonth.getMonth() - 1);
          dayFromPrevMonth.setDate(4);

          return getWeeks(dayFromPrevMonth, full);
        } else {
          const prevMonday = new Date(weeks[0][0]);
          prevMonday.setDate(prevMonday.getDate() - 7);

          return getWeeks(prevMonday, full);
        }
      });
    } else if (rangeType == 'months') {
      setRangeItems((months) => shiftMonths(months, false));
    } else if (rangeType == 'years') {
      setRangeItems((years) => shiftYears(years, false));
    }
  }

  function rightArrowClickHandler() {
    if (rangeType == 'days') {
      setRangeItems((daysOfWeek) => shiftWeekDays(daysOfWeek, true));
    } else if (rangeType == 'weeks') {
      setRangeItems((weeks) => {
        const full = windowWidth >= 768;

        if (full) {
          // последний понедельник всегда находится в текущем месяце
          const lastMonday = weeks[weeks.length - 1][0];

          // выбираем четвертый день в следующем месяце
          const dayFromNextMonth = new Date(lastMonday);
          dayFromNextMonth.setMonth(dayFromNextMonth.getMonth() + 1);
          dayFromNextMonth.setDate(4);

          return getWeeks(dayFromNextMonth, windowWidth >= 768);
        } else {
          const nextMonday = new Date(weeks[1][0]);
          nextMonday.setDate(nextMonday.getDate() + 14);

          return getWeeks(nextMonday, full);
        }
      });
    } else if (rangeType == 'months') {
      setRangeItems((months) => shiftMonths(months, true));
    } else if (rangeType == 'years') {
      setRangeItems((years) => shiftYears(years, true));
    }
  }

  function currentRangeItemClickHandler() {
    setRangeItems(getRangeItems(rangeType, range.fromDate, windowWidth));
  }

  function rangeItemClickHandler(rangeItem: [Date, Date]) {
    navigate(
      `/analytics/range?from=${rangeItem[0].toISOString()}&to=${rangeItem[1].toISOString()}`,
      { replace: true }
    );
  }

  return (
    <div className={`h-full flex flex-col items-center gap-3 select-none`}>
      <div className="flex gap-1 px-2 pb-1">
        <button
          className="rounded-md p-[6px] border border-solid border-gray-400 dark:border-gray-500 transition duration-300 hover:bg-gray-200 dark:hover:bg-backgroundDarkHover"
          onClick={leftArrowClickHandler}
        >
          <LeftChevronIcon />
        </button>

        <div
          onClick={currentRangeItemClickHandler}
          className="flex items-center justify-center text-lg font-medium transition duration-300 border border-gray-400 border-solid rounded-md dark:border-gray-500 w-52 hover:bg-gray-200 dark:hover:bg-backgroundDarkHover dark:text-textDark"
        >
          {renderDateLabel(rangeType, range.fromDate, range.toDate)}
        </div>

        <button
          className="rounded-md p-[6px] border border-solid border-gray-400 dark:border-gray-500 transition duration-300 hover:bg-gray-200 dark:hover:bg-backgroundDarkHover"
          onClick={rightArrowClickHandler}
        >
          <RightChevronIcon />
        </button>
      </div>

      <div
        className={`flex flex-wrap justify-center ${
          rangeType === 'days' ? 'gap-1' : 'gap-3'
        }`}
      >
        {rangeItems.map((rangeItem, index) => (
          <div
            key={index}
            onClick={() => rangeItemClickHandler(rangeItem)}
            className={`${rangeItemClassNames} ${
              isRangeItemSelected(rangeType, range.fromDate, rangeItem) &&
              'bg-gray-300 dark:bg-surfaceDarkHover'
            } ${isCurrentRangeItem(rangeType, rangeItem) && 'red-dot'}`}
          >
            {rangeType == 'days' && (
              <>
                <div className="text-[13px] font-medium text-gray-500 dark:text-textDarkSecondary">
                  {getDayOfWeekName(rangeItem[0].getDay())}
                </div>

                <div className="text-lg font-semibold dark:text-textDark">
                  {rangeItem[0].getDate().toString().length === 2
                    ? rangeItem[0].getDate()
                    : `0${rangeItem[0].getDate()}`}
                </div>
              </>
            )}

            {rangeType == 'weeks' && (
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

                <div className="flex gap-1.5 text-base lg:text-lg dark:text-textDark">
                  <time>
                    {getMonthName(rangeItem[0].getMonth())}{' '}
                    {rangeItem[0].getDate()}
                  </time>
                  <span>-</span>
                  <time>
                    {getMonthName(rangeItem[1].getMonth())}{' '}
                    {rangeItem[1].getDate()}
                  </time>
                </div>
              </>
            )}

            {rangeType == 'months' && (
              <>
                <div className="text-base text-slate-600 dark:text-textDarkSecondary">
                  {rangeItem[0].getFullYear()}
                </div>
                <div className="text-lg lg:text-xl dark:text-textDark">
                  {new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
                    rangeItem[0]
                  )}
                </div>
              </>
            )}

            {rangeType == 'years' && (
              <>
                <div className="text-xl text-center dark:text-textDark">
                  {rangeItem[0].getFullYear()}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RangeBox;
