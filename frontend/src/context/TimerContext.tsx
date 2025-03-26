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

import { ToastContainer, toast } from 'react-toastify';

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
  const dispatch = useAppDispatch();

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
      if (enabled) {
        document.title = 'Focus | Time Tracker';
      } else {
        document.title = 'Paused | Time Tracker';
      }
    } else {
      document.title = 'Time Tracker';
    }
  }, [enabled, currentSession]);

  useEffect(() => {
    const checkIfTimePassed = async () => {
      if (
        currentSession &&
        currentSession.spentTimeSeconds >= currentSession.totalTimeSeconds
      ) {
        try {
          await dispatch(updateSession(currentSession)).unwrap();

          stopTimer();
          playAudio(0.35);
          dispatch(setCompletedSessionId(currentSession.id));
          dispatch(resetCurrentSession());
          removeSessionFromLocalStorage();
        } catch (e) {
          toast('Произошла серверная ошибка при обновлении сессии', {
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
    <>
      <ToastContainer position="top-left" />

      <TimerContext.Provider value={{ toggleTimer, stopTimer, enabled }}>
        {children}
      </TimerContext.Provider>
    </>
  );
};

export default TimerProvider;

export const useTimer = () => useContext(TimerContext);
