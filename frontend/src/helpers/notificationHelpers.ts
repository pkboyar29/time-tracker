import { getReadableTimeHMS } from './timeHelpers';
import { ISession } from '../ts/interfaces/Session/ISession';

export const showNotification = (currentSession: ISession) => {
  if (typeof window.Notification === 'undefined') return;

  if (Notification.permission === 'granted') {
    const notification = new Notification('Session completed!', {
      body: `${
        currentSession.activity
          ? currentSession.activity.name
          : 'Without activity'
      } - ${getReadableTimeHMS(currentSession.totalTimeSeconds)}`,
    });

    setTimeout(() => {
      notification.close();
    }, 5000);
  }
};
