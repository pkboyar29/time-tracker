import {
  createContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
  FC,
  useContext,
} from 'react';
import { useAppSelector } from '../redux/store';
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

const timerWorker = new Worker(new URL('./timerWorker.js', import.meta.url));

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

  const startTimer = async (session: ISession, paused?: boolean) => {
    if (timerState.status == 'running') {
      try {
        await updateSession(timerState.session, true);
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

      setTimerState({ session: timerState.session, status: 'paused' });

      try {
        await updateSession(timerState.session, true);
      } catch (e) {
        toast('A server error occurred while updating session', {
          type: 'error',
        });
      }
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
      const sessionToUpdate = timerState.session;

      setTimerState({ status: 'idle', session: null });
      startTimestamp.current = 0;
      startSpentSeconds.current = 0;
      removeSessionFromLocalStorage();

      if (timerState.status == 'running' && shouldUpdateSession) {
        try {
          await updateSession(sessionToUpdate, true);
        } catch (e) {
          toast('A server error occurred while updating session', {
            type: 'error',
          });
        }
      }
    }
  };

  const finishTimer = async () => {
    if (timerState.status != 'idle') {
      try {
        playAudio();
        showNotification(timerState.session);

        await updateSession({
          ...timerState.session,
          spentTimeSeconds: timerState.session.totalTimeSeconds,
        });

        stopTimer();
      } catch (e) {
        toast('A server error occurred while updating session', {
          type: 'error',
        });
        stopTimer();
      }
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
    if (timerState.status == 'running') {
      timerWorker.postMessage({
        startTimestamp: startTimestamp.current,
        startSpentSeconds: startSpentSeconds.current,
        action: 'run',
      });
      timerWorker.onmessage = (ev) => {
        setTimerState((prev) => {
          if (prev.status == 'idle') return prev;

          return {
            status: 'running',
            session: { ...prev.session, spentTimeSeconds: ev.data },
          };
        });

        if (ev.data >= timerState.session.totalTimeSeconds) {
          finishTimer();
          timerWorker.postMessage({ action: 'pause' });
          return;
        }

        // automatic timer update on server every 5 minutes
        if ((ev.data - startSpentSeconds.current) % 300 == 0) {
          updateSession({
            ...timerState.session,
            spentTimeSeconds: ev.data,
          });
        }
      };
    } else {
      // if status is paused or idle
      timerWorker.postMessage({ action: 'pause' });
    }
  }, [timerState.status, timerState.session?.id]);

  useEffect(() => {
    if (timerState.status != 'idle' && currentUser) {
      const timerInTitle = currentUser.showTimerInTitle
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
  }, [timerState.status, timerState.session, currentUser]);

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    if (timerState.session) {
      updateSession(timerState.session, true);
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
