import { getReadableTimeHMS } from './timeHelpers';
import { ISession } from '../ts/interfaces/Session/ISession';

export const showSessionCompletedNotification = (
  currentSession: ISession,
  dailyGoalCompleted: boolean
) => {
  if (typeof window.Notification === 'undefined') return;

  try {
    if (Notification.permission === 'granted') {
      let notificationBody = `${
        currentSession.activity
          ? currentSession.activity.name
          : 'Without activity'
      } - ${getReadableTimeHMS(currentSession.totalTimeSeconds)}`;
      if (dailyGoalCompleted) {
        notificationBody += '\nDaily goal completed 🎯 Great job!';
      }

      const notification = new Notification('Session completed!', {
        body: notificationBody,
      });
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  } catch (e) {
    return;
  }
};
