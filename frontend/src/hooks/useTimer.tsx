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
  resetCurrentSession,
  setLastCompletedSessionId,
} from '../redux/slices/sessionSlice';
import { updateSession } from '../api/sessionApi';
import { removeSessionFromLocalStorage } from '../helpers/localstorageHelpers';
import { playAudio } from '../helpers/audioHelpers';
import {
  getRemainingTimeHoursMinutesSeconds,
  getTimerEndDate,
} from '../helpers/timeHelpers';
import { showNotification } from '../helpers/notificationHelpers';

import { toast } from 'react-toastify';

type TimerState = 'idle' | 'running' | 'paused';

interface TimerContextType {
  // TODO: totalTimeSeconds - временный костыль, удалить потом
  startTimer: (
    startSpentSeconds: number,
    totalTimeSeconds: number,
    paused?: boolean
  ) => void;
  toggleTimer: (startSpentSeconds: number) => void;
  stopTimer: () => void;
  timerState: TimerState;
  timerEndDate: Date;
}

const TimerContext = createContext<TimerContextType>({
  startTimer: () => {},
  toggleTimer: () => {},
  stopTimer: () => {},
  timerState: 'idle',
  timerEndDate: new Date(),
});

interface TimerProviderProps {
  children: ReactNode;
}

const TimerProvider: FC<TimerProviderProps> = ({ children }) => {
  const [timerState, setTimerState] = useState<TimerState>('idle');

  const startTimestamp = useRef<number>(0); // here we store timestamp
  const startSpentSeconds = useRef<number>(0); // here we store seconds

  const timerEndDate = useRef<Date>(new Date()); // here we store date when timer is going to end

  const currentSession = useAppSelector(
    (state) => state.sessions.currentSession
  );
  const currentUser = useAppSelector((state) => state.users.user);
  const dispatch = useAppDispatch();

  // TODO: totalTimeSeconds - временный костыль, который надо удалить, когда currentSession не будет null, когда вызываем эту функцию
  // TODO: во время запуска этой функции после вызова dispatch(setCurrentSession) currentSession не устанавливается сразу и в этой функции будет null
  const startTimer = (
    newStartSpentSeconds: number,
    totalTimeSeconds: number,
    paused?: boolean
  ) => {
    if (paused) {
      setTimerState('paused');
    } else {
      const newStartTimestamp = Date.now();
      startTimestamp.current = newStartTimestamp;
      startSpentSeconds.current = newStartSpentSeconds;

      timerEndDate.current = getTimerEndDate(
        newStartTimestamp,
        newStartSpentSeconds,
        totalTimeSeconds
      );

      setTimerState('running');
    }
  };

  const toggleTimer = (newStartSpentSeconds: number) => {
    if (timerState == 'running') {
      startTimestamp.current = 0;
      startSpentSeconds.current = 0;

      setTimerState('paused');
    } else if (timerState == 'paused') {
      const newStartTimestamp = Date.now();
      startTimestamp.current = newStartTimestamp;
      startSpentSeconds.current = newStartSpentSeconds;

      timerEndDate.current = getTimerEndDate(
        newStartTimestamp,
        newStartSpentSeconds,
        currentSession!.totalTimeSeconds
      );

      setTimerState('running');
    }
  };

  const stopTimer = () => {
    setTimerState('idle');
    startTimestamp.current = 0;
    startSpentSeconds.current = 0;
  };

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (timerState == 'running') {
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
  }, [timerState, dispatch]);

  useEffect(() => {
    if (timerState != 'idle' && currentSession) {
      const timerInTitle = currentUser?.showTimerInTitle
        ? `${getRemainingTimeHoursMinutesSeconds(
            currentSession.totalTimeSeconds,
            currentSession.spentTimeSeconds,
            true
          )}`
        : '';

      if (timerState == 'running') {
        document.title = `${timerInTitle} Focus | ${
          currentSession.activity
            ? currentSession.activity.name
            : 'Without activity'
        }`;
      } else if (timerState == 'paused') {
        document.title = `${timerInTitle} Paused | ${
          currentSession.activity
            ? currentSession.activity.name
            : 'Without activity'
        }`;
      }
    } else {
      document.title = 'Session Tracker';
    }
  }, [timerState, currentUser, currentSession]);

  useEffect(() => {
    const checkIfTimePassed = async () => {
      if (
        currentSession &&
        currentSession.spentTimeSeconds >= currentSession.totalTimeSeconds
      ) {
        try {
          stopTimer();
          playAudio();
          showNotification(currentSession);

          updateSession({
            ...currentSession,
            spentTimeSeconds: currentSession.totalTimeSeconds,
          });

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
      updateSession(currentSession);
    }
  };

  useEffect(() => {
    if (timerState == 'running') {
      window.addEventListener('beforeunload', handleBeforeUnload);
    } else if (timerState == 'paused') {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentSession?.spentTimeSeconds, timerState, dispatch]);

  return (
    <TimerContext.Provider
      value={{
        startTimer,
        toggleTimer,
        stopTimer,
        timerState,
        timerEndDate: timerEndDate.current,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export default TimerProvider;

export const useTimer = () => useContext(TimerContext);
