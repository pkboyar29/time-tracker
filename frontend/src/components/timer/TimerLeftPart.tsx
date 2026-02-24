import { FC, useState, useEffect, useRef } from 'react';
import { getRemainingTimeHoursMinutesSeconds } from '../../helpers/timeHelpers';
import { useTimerWithSeconds } from '../../hooks/useTimer';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { createSession } from '../../api/sessionApi';

import CustomCircularProgress from '../common/CustomCircularProgress';
import Button from '../common/Button';
import Tooltip from '../common/Tooltip';
import PauseIcon from '../../icons/PauseIcon';
import PlayIcon from '../../icons/PlayIcon';
import StopIcon from '../../icons/StopIcon';

interface TimerLeftPartProps {
  selectedSeconds: number;
  selectedActivityId: string;
}

const TimerLeftPart: FC<TimerLeftPartProps> = ({
  selectedSeconds,
  selectedActivityId,
}) => {
  const { t } = useTranslation();

  const { mutateAsync, isPending } = useMutation({ mutationFn: createSession });

  const {
    startTimer,
    toggleTimer,
    stopTimer,
    timerState,
    startTimestamp,
    startSpentSeconds,
  } = useTimerWithSeconds();
  const isTimerStarted = timerState.status != 'idle';
  const [spentMs, setSpentMs] = useState<number>(0);
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);

  // TODO bug: переключаясь между сессиями, может происходить туда сюда метание прогресса
  useEffect(() => {
    intervalId.current && clearInterval(intervalId.current);

    if (timerState.status == 'running') {
      intervalId.current = setInterval(() => {
        const newSpentMs =
          startSpentSeconds * 1000 + (Date.now() - startTimestamp);
        setSpentMs(newSpentMs);
      }, 100);
    } else if (timerState.status == 'paused') {
      setSpentMs(timerState.session.spentTimeSeconds * 1000); // set milliseconds rounded to full seconds
    } else {
      setSpentMs(0);
    }
    return () => {
      intervalId.current && clearInterval(intervalId.current);
    };
  }, [timerState.status, timerState.session?.id]);

  useEffect(() => {
    const handleKeyClick = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.code == 'Space') {
        if (isTimerStarted) {
          handleToggleButtonClick();
        } else {
          handleStartSessionClick();
        }
      } else if (event.code == 'Escape') {
        handleStopButtonClick();
      }
    };

    window.addEventListener('keyup', handleKeyClick);
    return () => {
      window.removeEventListener('keyup', handleKeyClick);
    };
  }, [timerState, selectedSeconds, selectedActivityId]);

  const handleStartSessionClick = async () => {
    try {
      const newSession = await mutateAsync({
        totalTimeSeconds: selectedSeconds,
        spentTimeSeconds: 0,
        activity: selectedActivityId !== '' ? selectedActivityId : undefined,
      });

      startTimer(newSession);
    } catch (e) {
      toast(t('serverErrors.startSession'), {
        type: 'error',
      });
    }
  };

  const handleToggleButtonClick = () => {
    toggleTimer();
  };

  const handleStopButtonClick = () => {
    stopTimer(true);
  };

  return (
    <div className="flex flex-col items-center gap-2 sm:flex-1 basis-1/3 sm:basis-auto">
      {!isTimerStarted ? (
        <CustomCircularProgress
          valuePercent={0}
          label={`${getRemainingTimeHoursMinutesSeconds(selectedSeconds, 0)}`}
          size="verybig"
        />
      ) : (
        <CustomCircularProgress
          valuePercent={
            (spentMs / (timerState.session.totalTimeSeconds * 1000)) * 100
          }
          label={`${getRemainingTimeHoursMinutesSeconds(
            timerState.session.totalTimeSeconds,
            timerState.session.spentTimeSeconds,
          )}`}
          size="verybig"
        />
      )}

      {!isTimerStarted ? (
        <div className="mt-2">
          <Button
            tabIndex={-1}
            disabled={isPending}
            onClick={(e) => {
              e.currentTarget.blur();
              handleStartSessionClick();
            }}
            className="py-[6.5px]"
          >
            {t('timerPage.startSessionButton')}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex mt-2 gap-7">
            <Tooltip<HTMLButtonElement>
              tooltipText={
                timerState.status === 'running'
                  ? t('timerPage.pauseTooltip')
                  : t('timerPage.resumeTooltip')
              }
            >
              {(ref) => (
                <button
                  ref={ref}
                  tabIndex={-1}
                  className="bg-surfaceLightHover hover:bg-[#B5B5B5] dark:bg-surfaceDark dark:hover:bg-surfaceDarkHover transition duration-300 rounded-full p-1.5 flex"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    handleToggleButtonClick();
                  }}
                >
                  {timerState.status === 'running' ? (
                    <PauseIcon />
                  ) : (
                    <PlayIcon />
                  )}
                </button>
              )}
            </Tooltip>

            <Tooltip<HTMLButtonElement>
              tooltipText={t('timerPage.stopTooltip')}
            >
              {(ref) => (
                <button
                  ref={ref}
                  tabIndex={-1}
                  className="bg-surfaceLightHover hover:bg-[#B5B5B5] dark:bg-surfaceDark dark:hover:bg-surfaceDarkHover transition duration-300 rounded-full p-1.5"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    handleStopButtonClick();
                  }}
                >
                  <StopIcon />
                </button>
              )}
            </Tooltip>
          </div>

          <div className="h-6 dark:text-textDark">
            {timerState.status == 'paused' && t('timerPage.paused')}
          </div>
        </>
      )}
    </div>
  );
};

export default TimerLeftPart;
