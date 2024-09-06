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
  addSecond,
  updateSession,
  resetSessionState,
} from '../redux/slices/sessionSlice';
import { playAudio } from '../helpers/audioHelpers';

interface TimerContextType {
  startTimer: () => void;
  toggleTimer: () => void;
  stopTimer: (afterDelete?: boolean) => void;
  enabled: boolean;
}

const TimerContext = createContext<TimerContextType>({
  startTimer: () => {},
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
  const currentSession = useSelector(
    (state: RootState) => state.sessions.currentSession
  );
  const dispatch = useAppDispatch();

  const startTimer = () => {
    setEnabled(true);
  };

  const toggleTimer = () => {
    setEnabled((e) => !e);
  };

  const stopTimer = () => {
    setEnabled(false);
  };

  useEffect(() => {
    if (!enabled) return;
    const intervalId = setInterval(() => {
      dispatch(addSecond());
    }, 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, [enabled]);

  useEffect(() => {
    if (currentSession) {
      if (currentSession.spentTimeSeconds === currentSession.totalTimeSeconds) {
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
    <TimerContext.Provider
      value={{ startTimer, toggleTimer, stopTimer, enabled }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export default TimerProvider;

export const useTimer = () => useContext(TimerContext);
