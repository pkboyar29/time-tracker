import {
  createContext,
  useState,
  useRef,
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
  setLastCompletedSessionId,
} from '../redux/slices/sessionSlice';
import { removeSessionFromLocalStorage } from '../helpers/localstorageHelpers';
import { playAudio } from '../helpers/audioHelpers';
import { getRemainingTimeHoursMinutesSeconds } from '../helpers/timeHelpers';

import { toast } from 'react-toastify';

interface TimerContextType {
  toggleTimer: (startSpentSeconds: number, mode: 'toggle' | 'enable') => void;
  stopTimer: () => void;
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

  const startTimestamp = useRef<number>(0); // here we store timestamp
  const startSpentSeconds = useRef<number>(0); // here we store seconds

  const currentSession = useAppSelector(
    (state) => state.sessions.currentSession
  );
  const currentUser = useAppSelector((state) => state.users.user);
  const dispatch = useAppDispatch();

  const toggleTimer = (
    newStartSpentSeconds: number,
    mode: 'toggle' | 'enable' = 'toggle'
  ) => {
    if (mode == 'toggle' && enabled == true) {
      startTimestamp.current = 0;
      startSpentSeconds.current = 0;
    } else {
      startTimestamp.current = Date.now();
      startSpentSeconds.current = newStartSpentSeconds;
    }

    if (mode === 'enable') {
      setEnabled(true);
    } else {
      setEnabled((enabled) => !enabled);
    }
  };

  const stopTimer = () => {
    setEnabled(false);
    startTimestamp.current = 0;
    startSpentSeconds.current = 0;
  };

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (enabled) {
      intervalId = setInterval(() => {
        if (currentSession) {
          const startTimestampSeconds = Math.floor(
            startTimestamp.current / 1000
          );
          const nowTimestampSeconds = Math.floor(Date.now() / 1000);

          const newSpentSeconds =
            startSpentSeconds.current +
            (nowTimestampSeconds - startTimestampSeconds);

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
          stopTimer();
          playAudio(0.35);

          await dispatch(
            updateSession({
              ...currentSession,
              spentTimeSeconds: currentSession.totalTimeSeconds,
            })
          ).unwrap();

          dispatch(setLastCompletedSessionId(currentSession.id));
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

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    if (currentSession) {
      dispatch(updateSession(currentSession));
    }
  };

  useEffect(() => {
    if (enabled) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentSession?.spentTimeSeconds, enabled, dispatch]);

  return (
    <TimerContext.Provider value={{ toggleTimer, stopTimer, enabled }}>
      {children}
    </TimerContext.Provider>
  );
};

export default TimerProvider;

export const useTimer = () => useContext(TimerContext);
