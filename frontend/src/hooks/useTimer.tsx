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
import { setLastCompletedSessionId } from '../redux/slices/sessionSlice';
import { updateSession } from '../api/sessionApi';
import {
  saveSessionToLocalStorage,
  removeSessionFromLocalStorage,
} from '../helpers/localstorageHelpers';
import { playAudio } from '../helpers/audioHelpers';
import {
  getRemainingTimeHoursMinutesSeconds,
  getTimerEndDate,
} from '../helpers/timeHelpers';
import { showNotification } from '../helpers/notificationHelpers';
import { toast } from 'react-toastify';

import { ISession } from '../ts/interfaces/Session/ISession';

// interface TimerState {
//   status: 'idle' | 'running' | 'paused';
//   session: ISession | null;
// }

type TimerState =
  | { status: 'idle'; session: null }
  | { status: 'running' | 'paused'; session: ISession };

interface TimerContextType {
  startTimer: (session: ISession, paused?: boolean) => Promise<void>;
  toggleTimer: () => Promise<void>;
  stopTimer: (shouldUpdateSession?: boolean) => Promise<void>;
  setNote: (note: string) => void;
  timerState: TimerState;
  timerEndDate: Date;
}

const TimerContext = createContext<TimerContextType>({
  startTimer: async () => {},
  toggleTimer: async () => {},
  stopTimer: async () => {},
  setNote: () => {},
  timerState: { status: 'idle', session: null },
  timerEndDate: new Date(),
});

interface TimerProviderProps {
  children: ReactNode;
}

const TimerProvider: FC<TimerProviderProps> = ({ children }) => {
  const [timerState, setTimerState] = useState<TimerState>({
    status: 'idle',
    session: null,
  });

  const startTimestamp = useRef<number>(0); // here we store timestamp
  const startSpentSeconds = useRef<number>(0); // here we store seconds

  const timerEndDate = useRef<Date>(new Date()); // here we store date when timer is going to end

  const currentUser = useAppSelector((state) => state.users.user);
  const dispatch = useAppDispatch();

  const startTimer = async (session: ISession, paused?: boolean) => {
    if (timerState.status == 'running') {
      try {
        await updateSession(timerState.session);
      } catch (e) {
        toast('A server error occurred while updating session', {
          type: 'error',
        });
      }
    }

    saveSessionToLocalStorage(session.id);

    if (paused) {
      setTimerState({ status: 'paused', session });
    } else {
      const newStartTimestamp = Date.now();
      startTimestamp.current = newStartTimestamp;
      startSpentSeconds.current = session.spentTimeSeconds;

      timerEndDate.current = getTimerEndDate(
        newStartTimestamp,
        session.spentTimeSeconds,
        session.totalTimeSeconds
      );

      setTimerState({ status: 'running', session });
    }
  };

  const toggleTimer = async () => {
    if (timerState.status == 'running') {
      startTimestamp.current = 0;
      startSpentSeconds.current = 0;

      try {
        await updateSession(timerState.session);
      } catch (e) {
        toast('A server error occurred while updating session', {
          type: 'error',
        });
      }

      console.log(timerState.session);
      setTimerState({ session: timerState.session, status: 'paused' });
    } else if (timerState.status == 'paused') {
      const newStartTimestamp = Date.now();
      startTimestamp.current = newStartTimestamp;
      startSpentSeconds.current = timerState.session.spentTimeSeconds;

      timerEndDate.current = getTimerEndDate(
        newStartTimestamp,
        timerState.session.spentTimeSeconds,
        timerState.session.totalTimeSeconds
      );

      setTimerState({ session: timerState.session, status: 'running' });
    }
  };

  // TODO: этот параметр мне кажется костылем
  const stopTimer = async (shouldUpdateSession?: boolean) => {
    if (timerState.status != 'idle') {
      if (timerState.status == 'running' && shouldUpdateSession) {
        try {
          await updateSession(timerState.session);
        } catch (e) {
          toast('A server error occurred while updating session', {
            type: 'error',
          });
        }
      }

      setTimerState({ status: 'idle', session: null });
      startTimestamp.current = 0;
      startSpentSeconds.current = 0;

      removeSessionFromLocalStorage();
    }
  };

  const setNote = (note: string) => {
    if (timerState.status != 'idle') {
      setTimerState({
        status: timerState.status,
        session: { ...timerState.session, note },
      });
    }
  };

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (timerState.status == 'running') {
      intervalId = setInterval(() => {
        const startTimestampSeconds = Math.floor(startTimestamp.current / 1000);
        const nowTimestampSeconds = Math.floor(Date.now() / 1000);

        const newSpentSeconds =
          startSpentSeconds.current +
          (nowTimestampSeconds - startTimestampSeconds);

        setTimerState((prev) => {
          if (prev.status == 'idle') return prev;

          return {
            status: 'running',
            session: { ...prev.session, spentTimeSeconds: newSpentSeconds },
          };
        });
      }, 1000);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [timerState.status]);

  useEffect(() => {
    if (timerState.status != 'idle') {
      const timerInTitle = currentUser?.showTimerInTitle
        ? `${getRemainingTimeHoursMinutesSeconds(
            timerState.session.totalTimeSeconds,
            timerState.session.spentTimeSeconds,
            true
          )}`
        : '';

      if (timerState.status == 'running') {
        document.title = `${timerInTitle} Focus | ${
          timerState.session.activity
            ? timerState.session.activity.name
            : 'Without activity'
        }`;
      } else if (timerState.status == 'paused') {
        document.title = `${timerInTitle} Paused | ${
          timerState.session.activity
            ? timerState.session.activity.name
            : 'Without activity'
        }`;
      }
    } else {
      document.title = 'Session Tracker';
    }
  }, [timerState.session, currentUser]);

  useEffect(() => {
    const checkIfTimePassed = async () => {
      console.log(timerState.session?.spentTimeSeconds);

      if (
        timerState.status != 'idle' &&
        timerState.session.spentTimeSeconds >=
          timerState.session.totalTimeSeconds
      ) {
        try {
          playAudio();
          showNotification(timerState.session);

          await updateSession({
            ...timerState.session,
            spentTimeSeconds: timerState.session.totalTimeSeconds,
          });
          dispatch(setLastCompletedSessionId(timerState.session.id));

          stopTimer();
        } catch (e) {
          toast('A server error occurred while updating session', {
            type: 'error',
          });
          stopTimer();
        }
      }
    };

    checkIfTimePassed();
  }, [timerState.session?.spentTimeSeconds]);

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    if (timerState.session) {
      updateSession(timerState.session);
    }
  };

  useEffect(() => {
    if (timerState.status == 'running') {
      window.addEventListener('beforeunload', handleBeforeUnload);
    } else if (timerState.status == 'paused') {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [timerState.session?.spentTimeSeconds, timerState.status]);

  return (
    <TimerContext.Provider
      value={{
        startTimer,
        toggleTimer,
        stopTimer,
        setNote,
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
