import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  FC,
  useContext,
} from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useAppDispatch } from '../redux/store';
import {
  changeSpentSeconds,
  updateSession,
  resetSessionState,
} from '../redux/slices/sessionSlice';
import { playAudio } from '../helpers/audioHelpers';

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

TimerContext.Provider;

interface TimerProviderProps {
  children: ReactNode;
}

const TimerProvider: FC<TimerProviderProps> = ({ children }) => {
  const [enabled, setEnabled] = useState<boolean>(false);

  const [startTimestamp, setStartTimestamp] = useState<number>(0); // here we store timestamp

  const [startSpentSeconds, setStartSpentSeconds] = useState<number>(0); // here we store seconds

  const currentSession = useSelector(
    (state: RootState) => state.sessions.currentSession
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
      if (currentSession.spentTimeSeconds >= currentSession.totalTimeSeconds) {
        playAudio(0.35);
        stopTimer();
        dispatch(updateSession(currentSession));
        dispatch(resetSessionState());
      }
    }
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
