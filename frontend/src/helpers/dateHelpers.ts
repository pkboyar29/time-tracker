const getWeekDays = (date: Date): Date[] => {
  let startOfWeekDate: Date = date;
  const initialDayOfWeek: number = date.getDay();

  // find start of week in date format (start of week - 0 index - sunday)
  for (let i = initialDayOfWeek; i > 0; i--) {
    startOfWeekDate.setDate(startOfWeekDate.getDate() - 1);
  }

  // generate array of 7 dates starting from sunday
  let daysOfWeek: Date[] = [startOfWeekDate];
  let dateInLoop: Date = new Date(startOfWeekDate);
  for (let i = 1; i < 7; i++) {
    dateInLoop.setDate(startOfWeekDate.getDate() + i);
    daysOfWeek.push(new Date(dateInLoop));
  }

  return daysOfWeek;
};

const getDayOfWeekName = (dayNumber: number): string => {
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

const shiftWeek = (week: Date[], toNextWeek: boolean): Date[] => {
  let newWeek: Date[] = [];
  for (let i = 0; i < 7; i++) {
    newWeek.push(new Date(week[i]));
  }

  const step: number = toNextWeek ? 7 : -7;
  for (let i = 0; i < 7; i++) {
    newWeek[i].setDate(newWeek[i].getDate() + step);
  }

  return newWeek;
};

const getFiveMonths = (middleDate: Date): Date[] => {
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

const shiftFiveMonths = (fiveMonths: Date[], right: boolean): Date[] => {
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

export {
  getWeekDays,
  getDayOfWeekName,
  shiftWeek,
  getFiveMonths,
  shiftFiveMonths,
};
