import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  FC,
  useContext,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import {
  addSecond,
  removeCurrentSession,
  updateSession,
} from '../redux/slices/sessionSlice';
import { playAudio } from '../utils/audioHelpers';

interface TimerContextType {
  startTimer: () => void;
  toggleTimer: () => void;
  stopTimer: () => void;
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
  const dispatch = useDispatch<AppDispatch>();

  const startTimer = () => {
    setEnabled(true);
  };

  const toggleTimer = () => {
    setEnabled((e) => !e);
    if (enabled) {
      if (currentSession) {
        dispatch(updateSession(currentSession));
      }
    }
  };

  const stopTimer = () => {
    setEnabled((e) => !e);
    setEnabled(false);
    if (currentSession) {
      dispatch(updateSession(currentSession));
    }
    dispatch(removeCurrentSession());
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
