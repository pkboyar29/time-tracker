import { FC, useEffect } from 'react';
import { getRemainingTimeHoursMinutesSeconds } from '../helpers/timeHelpers';
import { useTimerWithSeconds } from '../hooks/useTimer';
import { useAppSelector } from '../redux/store';
import { useTranslation } from 'react-i18next';

const TimerTitleUpdater: FC = () => {
  const { timerState } = useTimerWithSeconds();
  const currentUser = useAppSelector((state) => state.users.user);
  const { t } = useTranslation();

  useEffect(() => {
    if (timerState.status != 'idle' && currentUser) {
      const timerInTitle = currentUser.showTimerInTitle
        ? `${getRemainingTimeHoursMinutesSeconds(
            timerState.session.totalTimeSeconds,
            timerState.session.spentTimeSeconds,
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
  }, [
    timerState.status,
    timerState.session,
    timerState.session?.spentTimeSeconds,
    currentUser,
  ]);

  return <></>;
};

export default TimerTitleUpdater;
