import { FC, useEffect } from 'react';
import { getRemainingTimeHoursMinutesSeconds } from '../helpers/timeHelpers';
import { useTimer } from '../hooks/useTimer';
import { useAppSelector } from '../redux/store';
import { useTranslation } from 'react-i18next';

const TimerTitleUpdater: FC = () => {
  const { timerState, currentSeconds } = useTimer(true);
  const currentUser = useAppSelector((state) => state.users.user);
  const { t } = useTranslation();

  useEffect(() => {
    if (timerState.status != 'idle' && currentUser) {
      const timerInTitle = currentUser.showTimerInTitle
        ? `${getRemainingTimeHoursMinutesSeconds(
            timerState.session.totalTimeSeconds,
            currentSeconds,
            true,
          )}`
        : '';

      if (timerState.status == 'running') {
        document.title = `${timerInTitle} ${t('title.focus')} | ${
          timerState.session.activity
            ? timerState.session.activity.name
            : t('withoutActivity')
        }`;
      } else if (timerState.status == 'paused') {
        document.title = `${timerInTitle} ${t('title.paused')} | ${
          timerState.session.activity
            ? timerState.session.activity.name
            : t('withoutActivity')
        }`;
      }
    } else {
      document.title = 'Session Tracker';
    }
  }, [timerState.status, timerState.session, currentSeconds, currentUser]);

  return <></>;
};

export default TimerTitleUpdater;
