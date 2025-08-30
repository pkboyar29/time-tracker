import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  FC,
  useContext,
} from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import {
  changeSpentSeconds,
  updateSession,
  resetCurrentSession,
  setCompletedSessionId,
} from '../redux/slices/sessionSlice';
import { removeSessionFromLocalStorage } from '../helpers/localstorageHelpers';
import { playAudio } from '../helpers/audioHelpers';
import { getRemainingTimeHoursMinutesSeconds } from '../helpers/timeHelpers';

import { toast } from 'react-toastify';

interface TimerContextType {
  toggleTimer: (startSpentSeconds: number) => void;
  stopTimer: (afterDelete?: boolean) => void;
  enabled: boolean;
}

const TimerContext = createContext<TimerContextType>({
  toggleTimer: () => {},
  stopTimer: () => {},
  enabled: false,
});

interface TimerProviderProps {
  children: ReactNode;
}

const TimerProvider: FC<TimerProviderProps> = ({ children }) => {
  const [enabled, setEnabled] = useState<boolean>(false);

  const [startTimestamp, setStartTimestamp] = useState<number>(0); // here we store timestamp

  const [startSpentSeconds, setStartSpentSeconds] = useState<number>(0); // here we store seconds

  const currentSession = useAppSelector(
    (state) => state.sessions.currentSession
  );
  const currentUser = useAppSelector((state) => state.users.user);
  const dispatch = useAppDispatch();

  // TODO: не должны ли мы при нажатии на паузу устанавливать startTimestamp и startSpentSeconds на 0?
  const toggleTimer = (startSpentSeconds: number) => {
    if (!enabled) {
      setStartTimestamp(Date.now());
      setStartSpentSeconds(startSpentSeconds);
    }
    setEnabled((enabled) => !enabled);
  };

  const stopTimer = () => {
    setEnabled(false);
    setStartTimestamp(0);
    setStartSpentSeconds(0);
  };

  useEffect(() => {
    let intervalId: number;

    if (enabled) {
      intervalId = setInterval(() => {
        if (currentSession) {
          const startTimestampSeconds = Math.floor(startTimestamp / 1000);
          const nowTimestampSeconds = Math.floor(Date.now() / 1000);

          const newSpentSeconds =
            startSpentSeconds + (nowTimestampSeconds - startTimestampSeconds);

          dispatch(changeSpentSeconds(newSpentSeconds));
        }
      }, 1000);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, dispatch]);

  useEffect(() => {
    if (currentSession) {
      const timerInTitle = currentUser?.showTimerInTitle
        ? `${getRemainingTimeHoursMinutesSeconds(
            currentSession.totalTimeSeconds,
            currentSession.spentTimeSeconds,
            true
          )}`
        : '';

      if (enabled) {
        document.title = `${timerInTitle} Focus | ${
          currentSession.activity
            ? currentSession.activity.name
            : 'Without activity'
        }`;
      } else {
        document.title = `${timerInTitle} Paused | ${
          currentSession.activity
            ? currentSession.activity.name
            : 'Without activity'
        }`;
      }
    } else {
      document.title = 'Time Tracker';
    }
  }, [enabled, currentUser, currentSession]);

  useEffect(() => {
    const checkIfTimePassed = async () => {
      if (
        currentSession &&
        currentSession.spentTimeSeconds >= currentSession.totalTimeSeconds
      ) {
        try {
          // TODO: останавливать таймер и воспроизводить музыку надо до того, как запрос завершиться? просто когда 1 секунду идет запрос, а музыки все еще нет, это странно. Также странно то, что таймер не выглядит остановленным, пока не завершился запрос
          await dispatch(
            updateSession({
              ...currentSession,
              spentTimeSeconds: currentSession.totalTimeSeconds,
            })
          ).unwrap();

          stopTimer();
          playAudio(0.35);
          dispatch(setCompletedSessionId(currentSession.id));
          dispatch(resetCurrentSession());
          removeSessionFromLocalStorage();
        } catch (e) {
          // TODO: тут можно писать: но время все равно сохранилось
          toast('A server error occurred while updating session', {
            type: 'error',
          });
          stopTimer();
        }
      }
    };

    checkIfTimePassed();
  }, [currentSession?.spentTimeSeconds]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      if (currentSession) {
        dispatch(updateSession(currentSession));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentSession, dispatch]);

  return (
    <TimerContext.Provider value={{ toggleTimer, stopTimer, enabled }}>
      {children}
    </TimerContext.Provider>
  );
};

export default TimerProvider;

export const useTimer = () => useContext(TimerContext);
