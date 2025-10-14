import { getTimeHoursMinutes } from './timeHelpers';
import { ISession } from '../ts/interfaces/Session/ISession';

export const showNotification = (currentSession: ISession) => {
  const notification = new Notification('Session completed!', {
    body: `${
      currentSession.activity
        ? currentSession.activity.name
        : 'Without activity'
    } - ${getTimeHoursMinutes(currentSession.totalTimeSeconds)}`,
  });
  setTimeout(() => {
    notification.close();
  }, 5000);
};
