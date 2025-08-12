export const getWeekDays = (date: Date): Date[] => {
  // find start of week in date format (start of week - 1 index - monday)
  let startOfWeekDate: Date = new Date(date);
  if (startOfWeekDate.getDay() == 0) {
    startOfWeekDate.setDate(startOfWeekDate.getDate() - 1);
  }
  while (startOfWeekDate.getDay() != 1) {
    startOfWeekDate.setDate(startOfWeekDate.getDate() - 1);
  }

  // generate array of 7 dates starting from monday
  let daysOfWeek: Date[] = [startOfWeekDate];
  let dateInLoop: Date = new Date(startOfWeekDate);
  for (let i = 1; i < 7; i++) {
    dateInLoop.setDate(dateInLoop.getDate() + 1);
    daysOfWeek.push(new Date(dateInLoop));
  }

  return daysOfWeek;
};

export const getDayOfWeekName = (dayNumber: number): string => {
  switch (dayNumber) {
    case 0:
      return 'SUN';
    case 1:
      return 'MON';
    case 2:
      return 'TUE';
    case 3:
      return 'WED';
    case 4:
      return 'THU';
    case 5:
      return 'FRI';
    case 6:
      return 'SAT';
    default:
      return 'undefined';
  }
};

export const shiftWeekDays = (days: Date[], right: boolean): Date[] => {
  let newDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    newDays.push(new Date(days[i]));
  }

  const step: number = right ? 7 : -7;
  for (let i = 0; i < 7; i++) {
    newDays[i].setDate(newDays[i].getDate() + step);
  }

  return newDays;
};

export const getMonthName = (monthNumber: number) => {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return `${months[monthNumber]}`;
};

export const getMonthDetailedName = (date: Date) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

// TODO: можно указать такой тип [Date, Date][]
export const getMonthWeeks = (date: Date): Date[][] => {
  date = new Date(date);

  // находим дату понедельника
  let mondayDate: Date = new Date(date);
  if (date.getDay() == 0) {
    date.setDate(date.getDate() + 1);
    mondayDate = new Date(date);
  } else if (date.getDay() > 1) {
    while (date.getDay() != 1) {
      date.setDate(date.getDate() - 1);
    }
    mondayDate = new Date(date);
  }

  // определяем первый понедельник месяца, с которого начнем отсчет по четырем/пяти неделям
  let firstWeekMonday: Date;
  while (true) {
    if (mondayDate.getDate() <= 4) {
      firstWeekMonday = new Date(mondayDate);
      break;
    }

    if (mondayDate.getDate() >= 28) {
      firstWeekMonday = new Date(mondayDate);
      break;
    }

    mondayDate.setDate(mondayDate.getDate() - 7);
  }
  firstWeekMonday.setHours(0);
  firstWeekMonday.setMinutes(0);
  firstWeekMonday.setSeconds(0);
  firstWeekMonday.setMilliseconds(0);

  // определяем четыре недели
  let weeks: Date[][] = [];
  let monday: Date = new Date(firstWeekMonday);
  let sunday: Date = new Date(firstWeekMonday);
  sunday.setDate(sunday.getDate() + 7);
  sunday.setMilliseconds(sunday.getMilliseconds() - 1);
  while (weeks.length < 4) {
    weeks.push([new Date(monday), new Date(sunday)]);

    monday.setDate(monday.getDate() + 7);
    sunday.setDate(sunday.getDate() + 7);
  }

  // берем пятую неделю в случае, если в ней больше дней месяца, чем в следующем месяце
  let day = new Date(monday);
  let prevMonthDaysCount = 0;
  let nextMonthDaysCount = 0;
  for (let i = 1; i <= 7; i++) {
    if (day.getMonth() == monday.getMonth()) {
      prevMonthDaysCount++;
    }
    if (day.getMonth() == sunday.getMonth()) {
      nextMonthDaysCount++;
    }

    day.setDate(day.getDate() + 1);
  }
  if (prevMonthDaysCount > nextMonthDaysCount) {
    weeks.push([new Date(monday), new Date(sunday)]);
  }

  return weeks;
};

export const getFiveMonths = (middleDate: Date): Date[] => {
  const fiveMonths: Date[] = [];

  for (let i = 2; i > 0; i--) {
    const date: Date = new Date(middleDate);
    date.setMonth(date.getMonth() - i);
    fiveMonths.push(date);
  }
  fiveMonths.push(new Date(middleDate));
  for (let i = 1; i < 3; i++) {
    const date: Date = new Date(middleDate);
    date.setMonth(date.getMonth() + i);
    fiveMonths.push(date);
  }

  return fiveMonths;
};

export const shiftFiveMonths = (fiveMonths: Date[], right: boolean): Date[] => {
  let newFiveMonths: Date[] = [];
  for (let i = 0; i < 5; i++) {
    newFiveMonths.push(fiveMonths[i]);
  }

  const step: number = right ? 5 : -5;
  for (let i = 0; i < 5; i++) {
    newFiveMonths[i].setMonth(newFiveMonths[i].getMonth() + step);
  }

  return newFiveMonths;
};

export const getTwoYears = (yearDate: Date): Date[] => {
  const previousYearDate: Date = new Date(yearDate);
  previousYearDate.setFullYear(yearDate.getFullYear() - 1);

  const twoYears: Date[] = [previousYearDate, yearDate];
  return twoYears;
};

export const shiftTwoYears = (twoYears: Date[], right: boolean): Date[] => {
  let newTwoYears: Date[] = [];
  for (let i = 0; i < 2; i++) {
    newTwoYears.push(twoYears[i]);
  }

  const step: number = right ? 2 : -2;
  for (let i = 0; i < 2; i++) {
    newTwoYears[i].setFullYear(newTwoYears[i].getFullYear() + step);
  }

  return newTwoYears;
};

export const getDayRange = (date: Date): [Date, Date] => {
  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );

  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(startOfDay.getDate() + 1);

  return [startOfDay, endOfDay];
};

export const getWeekRange = (date: Date): [Date, Date] => {
  const mondayDate = new Date(date);

  // in case of sunday we are shifting the day to saturday (6)
  if (mondayDate.getDay() == 0) {
    mondayDate.setDate(mondayDate.getDate() - 1);
  }

  while (mondayDate.getDay() != 1) {
    mondayDate.setDate(mondayDate.getDate() - 1);
  }
  mondayDate.setHours(0);
  mondayDate.setMinutes(0);
  mondayDate.setSeconds(0);
  mondayDate.setMilliseconds(0);

  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(sundayDate.getDate() + 6);
  sundayDate.setHours(23);
  sundayDate.setMinutes(59);
  sundayDate.setSeconds(59);
  sundayDate.setMilliseconds(999);

  return [mondayDate, sundayDate];
};

export const getMonthRange = (date: Date): [Date, Date] => {
  const startOfMonth = new Date(date);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0);
  startOfMonth.setMinutes(0);
  startOfMonth.setSeconds(0);
  startOfMonth.setMilliseconds(0);

  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);

  return [startOfMonth, endOfMonth];
};

export const getYearRange = (date: Date): [Date, Date] => {
  const startOfYear = new Date(date);
  startOfYear.setMonth(0);
  startOfYear.setDate(1);
  startOfYear.setHours(0);
  startOfYear.setMinutes(0);
  startOfYear.setSeconds(0);
  startOfYear.setMilliseconds(0);

  const endOfYear = new Date(startOfYear);
  endOfYear.setFullYear(startOfYear.getFullYear() + 1);

  return [startOfYear, endOfYear];
};

export const isStartOfDay = (date: Date) => {
  return (
    date.getHours() == 0 &&
    date.getMinutes() == 0 &&
    date.getSeconds() == 0 &&
    date.getMilliseconds() == 0
  );
};

export const isEndOfDay = (date: Date) => {
  return (
    date.getHours() == 23 &&
    date.getMinutes() == 59 &&
    date.getSeconds() == 59 &&
    date.getMilliseconds() == 999
  );
};

export const isSameDay = (oneDay: Date, twoDay: Date) => {
  return (
    oneDay.getFullYear() == twoDay.getFullYear() &&
    oneDay.getMonth() == twoDay.getMonth() &&
    oneDay.getDate() == twoDay.getDate()
  );
};

export type RangeType = 'days' | 'weeks' | 'months' | 'years' | 'custom';

export const getRangeType = (fromDate: Date, toDate: Date): RangeType => {
  if (
    // если fromDate и toDate - начала дня, а также разница между ними - ровно один день ИЛИ это один день, но fromDate - начало дня, а toDate - конец дня
    (toDate.getTime() - fromDate.getTime() == 86400000 &&
      isStartOfDay(fromDate) &&
      isStartOfDay(toDate)) ||
    (isSameDay(fromDate, toDate) &&
      isStartOfDay(fromDate) &&
      isEndOfDay(toDate))
  ) {
    return 'days';
  } else if (
    // если fromDate - понедельник и начало дня, а toDate - воскресенье и конец дня, а также разница между ними - ровно одна неделя
    toDate.getTime() - fromDate.getTime() == 86400000 * 7 - 1 &&
    fromDate.getDay() == 1 &&
    toDate.getDay() == 0 &&
    isStartOfDay(fromDate) &&
    isEndOfDay(toDate)
  ) {
    return 'weeks';
  } else if (
    // если fromDate - начало месяца, а toDate - начало следующего месяца, а также разница между ними - ровно один месяц
    (toDate.getMonth() - fromDate.getMonth() == 1 ||
      (toDate.getMonth() == 0 && fromDate.getMonth() == 11)) &&
    fromDate.getDate() == 1 &&
    toDate.getDate() == 1 &&
    isStartOfDay(fromDate) &&
    isStartOfDay(toDate)
  ) {
    return 'months';
  } else if (
    // если fromDate - начало января года, а toDate - начало января следующего года, а также разница между ними - ровно один год
    toDate.getFullYear() - fromDate.getFullYear() == 1 &&
    fromDate.getMonth() == 0 &&
    toDate.getMonth() == 0 &&
    fromDate.getDate() == 1 &&
    toDate.getDate() == 1 &&
    isStartOfDay(fromDate) &&
    isStartOfDay(toDate)
  ) {
    return 'years';
  } else {
    return 'custom';
  }
};

export const toLocalISOString = (date: Date) => {
  const pad = (n: any) => {
    return n.toString().padStart(2, '0');
  };

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};
