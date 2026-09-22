import { FC, useEffect } from 'react';
import {
  getRemainingTimeHoursMinutesSeconds,
  secondsToMs,
  msToSeconds,
} from '../../helpers/timeHelpers';
import { useTimerWithMs } from '../../hooks/useTimer';
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
import CheckIcon from '../../icons/CheckIcon';

interface TimerLeftPartProps {
  selectedSeconds: number;
  selectedActivityId: string;
}

const adjustmentMinutes = 5;
const adjustmentSeconds = adjustmentMinutes * 60;

const TimerLeftPart: FC<TimerLeftPartProps> = ({ selectedSeconds, selectedActivityId }) => {
  const { t } = useTranslation();

  const { mutateAsync, isPending } = useMutation({ mutationFn: createSession });

  const { startTimer, toggleTimer, changeTotalTimeSeconds, finishTimer, stopTimer, timerState } =
    useTimerWithMs();
  const isTimerStarted = timerState.status != 'idle';

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

      if (event.code === 'Space') {
        // исключаем стандартное поведение, например срабатывание событий с фокусированных кнопок
        event.preventDefault();

        if (isTimerStarted) {
          handleToggleButtonClick();
        } else {
          handleStartSessionClick();
        }
      } else if (event.code === 'Escape') {
        event.preventDefault();

        handleStopButtonClick();
      }
    };

    window.addEventListener('keydown', handleKeyClick);
    return () => {
      window.removeEventListener('keydown', handleKeyClick);
    };
  }, [timerState, selectedSeconds, selectedActivityId]);

  const handleStartSessionClick = async () => {
    try {
      const newSession = await mutateAsync({
        totalTimeSeconds: selectedSeconds,
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

  const handleMinusButtonClick = () => {
    if (!timerState.session) return;
    changeTotalTimeSeconds(timerState.session.totalTimeSeconds - adjustmentSeconds);
  };

  const handleFinishEarlyClick = () => {
    finishTimer(true);
  };

  const handlePlusButtonClick = () => {
    if (!timerState.session) return;
    changeTotalTimeSeconds(timerState.session.totalTimeSeconds + adjustmentSeconds);
  };

  return (
    <>
      <div className="relative inline-flex items-center justify-center">
        {isTimerStarted && (
          <Tooltip<HTMLButtonElement>
            tooltipText={`${t('timerPage.minusTooltip')} ${t('time.minutes', { count: adjustmentMinutes })}`}
          >
            {(ref) => (
              <button
                disabled={
                  timerState.session.totalTimeSeconds - adjustmentSeconds <=
                  msToSeconds(timerState.ms)
                }
                ref={ref}
                tabIndex={-1}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[116%] sm:-translate-x-[130%] bg-surfaceLightHover hover:bg-[#B5B5B5] dark:bg-surfaceDark dark:hover:bg-surfaceDarkHover
      w-[31.5px] h-[31.5px] transition duration-300 rounded-full p-1.5 flex justify-center items-center dark:text-textDark 
      opacity-70 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleMinusButtonClick}
              >
                -{adjustmentMinutes}
              </button>
            )}
          </Tooltip>
        )}

        <CustomCircularProgress
          valuePercent={
            isTimerStarted
              ? (timerState.ms / secondsToMs(timerState.session.totalTimeSeconds)) * 100
              : 0
          }
          label={
            isTimerStarted
              ? getRemainingTimeHoursMinutesSeconds(
                  timerState.session.totalTimeSeconds,
                  msToSeconds(timerState.ms),
                )
              : getRemainingTimeHoursMinutesSeconds(selectedSeconds, 0)
          }
          size="verybig"
        />

        {isTimerStarted && (
          <Tooltip<HTMLButtonElement>
            tooltipText={`${t('timerPage.plusTooltip')} ${t('time.minutes', { count: adjustmentMinutes })}`}
          >
            {(ref) => (
              <button
                ref={ref}
                tabIndex={-1}
                disabled={timerState.session.totalTimeSeconds + adjustmentSeconds > 36_000} // 10 hours
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[116%] sm:translate-x-[130%] bg-surfaceLightHover hover:bg-[#B5B5B5] dark:bg-surfaceDark dark:hover:bg-surfaceDarkHover
      w-[31.5px] h-[31.5px] transition duration-300 rounded-full p-1.5 flex justify-center items-center dark:text-textDark 
      opacity-70 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handlePlusButtonClick}
              >
                +{adjustmentMinutes}
              </button>
            )}
          </Tooltip>
        )}
      </div>

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
          <div className="flex gap-5 mt-2">
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
                  className="bg-surfaceLightHover hover:bg-[#B5B5B5] dark:bg-surfaceDark dark:hover:bg-surfaceDarkHover transition duration-300 rounded-full p-1.5"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    handleToggleButtonClick();
                  }}
                >
                  {timerState.status === 'running' ? <PauseIcon /> : <PlayIcon />}
                </button>
              )}
            </Tooltip>

            <Tooltip<HTMLButtonElement> tooltipText={t('timerPage.stopTooltip')}>
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

            <Tooltip<HTMLButtonElement> tooltipText={t('timerPage.finishEarlyTooltip')}>
              {(ref) => (
                <button
                  ref={ref}
                  tabIndex={-1}
                  className="bg-surfaceLightHover hover:bg-[#B5B5B5] dark:bg-surfaceDark dark:hover:bg-surfaceDarkHover
      transition duration-300 rounded-full p-1.5"
                  onClick={handleFinishEarlyClick}
                >
                  <CheckIcon />
                </button>
              )}
            </Tooltip>
          </div>

          <div className="h-6 dark:text-textDark">
            {timerState.status === 'paused' && t('timerPage.paused')}
          </div>
        </>
      )}
    </>
  );
};

export default TimerLeftPart;
