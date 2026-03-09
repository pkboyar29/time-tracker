import { getReadableTime } from './timeHelpers';
import { ISession } from '../ts/interfaces/Session/ISession';
import { t } from 'i18next';

interface ShowSessionCompletedNotificationParams {
  session: ISession;
  dailyGoalCompleted?: boolean;
  onClose?: () => void;
}

export const showSessionCompletedNotification = ({
  session,
  dailyGoalCompleted,
  onClose,
}: ShowSessionCompletedNotificationParams) => {
  if (typeof window.Notification === 'undefined') return;

  try {
    if (Notification.permission === 'granted') {
      const activityName = session.activity
        ? session.activity.name
        : t('withoutActivity');

      let notificationBody = `${activityName} - ${getReadableTime(
        session.totalTimeSeconds,
        t,
        {
          short: false,
        },
      )}`;
      if (dailyGoalCompleted) {
        notificationBody += `\n${t('notifications.dailyGoalCompleted')}`;
      }

      const notification = new Notification(
        t('notifications.sessionCompleted'),
        {
          body: notificationBody,
        },
      );
      if (onClose) {
        notification.addEventListener('close', () => {
          onClose();
        });
      }
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  } catch (e) {
    return;
  }
};
