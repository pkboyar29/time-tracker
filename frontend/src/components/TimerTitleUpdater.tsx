import { FC, useEffect } from 'react';
import {
  getRemainingTimeHoursMinutesSeconds,
  msToSeconds,
} from '../helpers/timeHelpers';
import { setFavicon } from '../helpers/htmlHelpers';
import { useTimerWithMs } from '../hooks/useTimer';
import { useAppSelector } from '../redux/store';
import { useTranslation } from 'react-i18next';

const TimerTitleUpdater: FC = () => {
  const { timerState } = useTimerWithMs();
  const currentUser = useAppSelector((state) => state.users.user);
  const { t } = useTranslation();

  // title
  useEffect(() => {
    if (!currentUser) {
      return;
    }
    if (timerState.status === 'idle') {
      document.title = 'Session Tracker';
      return;
    }

    const isFocused = timerState.status === 'running';

    const timerText = currentUser.showTimerInTitle
      ? `${getRemainingTimeHoursMinutesSeconds(
          timerState.session.totalTimeSeconds,
          msToSeconds(timerState.ms),
          true,
        )}`
      : '';
    const activityText = timerState.session.activity
      ? timerState.session.activity.name
      : t('withoutActivity');
    const focusOrPaused = isFocused ? t('title.focus') : t('title.paused');
    document.title = `${timerText} ${focusOrPaused} | ${activityText}`;
  }, [timerState.status, timerState.session, timerState.ms, currentUser]);

  // favicon
  useEffect(() => {
    if (!currentUser) {
      return;
    }
    if (timerState.status === 'idle') {
      setFavicon('/favicon.ico');
      return;
    }

    const isFocused = timerState.status === 'running';
    if (isFocused) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      ctx.fillStyle = 'white';
      ctx.font = '30px sans-serif';
      ctx.fillText('🎯', 0, 26);

      setFavicon(canvas.toDataURL(''));
    } else {
      // paused
      setFavicon('/favicon.ico');
    }
  }, [timerState.status, timerState.session, currentUser]);

  return <></>;
};

export default TimerTitleUpdater;
