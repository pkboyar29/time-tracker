import {
  createContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
  FC,
  useContext,
} from 'react';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { setUser } from '../redux/slices/userSlice';
import { updateSession } from '../api/sessionApi';
import {
  saveSessionToLS,
  removeSessionFromLS,
} from '../helpers/localstorageHelpers';
import { playAudio } from '../helpers/audioHelpers';
import {
  getRemainingTimeHoursMinutesSeconds,
  getTimerEndDate,
} from '../helpers/timeHelpers';
import { showSessionCompletedNotification } from '../helpers/notificationHelpers';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { ISession } from '../ts/interfaces/Session/ISession';

const timerWorker = new Worker(new URL('./timerWorker.js', import.meta.url));

type TimerState =
  | { status: 'idle'; session: null }
  | { status: 'running' | 'paused'; session: ISession };

interface TimerContextType {
  startTimer: (session: ISession, paused?: boolean) => Promise<void>;
  toggleTimer: () => Promise<void>;
  stopTimer: (shouldUpdateSession?: boolean) => Promise<void>;
  timerState: TimerState;
  timerEndDate: Date;
  startTimestamp: number;
  startSpentSeconds: number;
}

const TimerContext = createContext<TimerContextType>({
  startTimer: async () => {},
  toggleTimer: async () => {},
  stopTimer: async () => {},
  timerState: { status: 'idle', session: null },
  timerEndDate: new Date(),
  startTimestamp: 0,
  startSpentSeconds: 0,
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
  const { t } = useTranslation();

  const startTimer = async (session: ISession, paused?: boolean) => {
    if (timerState.status == 'running') {
      try {
        await updateSession(timerState.session, true);
      } catch (e) {
        toast(t('serverErrors.updateSession'), {
          type: 'error',
        });
      }
    }

    saveSessionToLS(session, 'session');

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
        toast(t('serverErrors.updateSessionButSaved'), {
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

  const stopTimer = async (shouldUpdateSession?: boolean) => {
    if (timerState.status != 'idle') {
      const sessionToUpdate = timerState.session;

      setTimerState({ status: 'idle', session: null });
      startTimestamp.current = 0;
      startSpentSeconds.current = 0;
      removeSessionFromLS('session');

      if (timerState.status == 'running' && shouldUpdateSession) {
        try {
          await updateSession(sessionToUpdate, true);
        } catch (e) {
          toast(t('serverErrors.updateSessionButSaved'), {
            type: 'error',
          });
          saveSessionToLS(timerState.session, 'unsyncedSession');
        }
      }
    }
  };

  const finishTimer = async () => {
    if (timerState.status != 'idle') {
      let updatedUser = {
        ...currentUser!,
        todaySpentTimeSeconds:
          currentUser!.todaySpentTimeSeconds +
          timerState.session.totalTimeSeconds,
      };
      const isDailyGoalCompleted =
        updatedUser.todaySpentTimeSeconds >= updatedUser.dailyGoal;

      playAudio();
      showSessionCompletedNotification(
        timerState.session,
        isDailyGoalCompleted && !updatedUser.dailyGoalCompletionNotified
      );
      if (isDailyGoalCompleted) {
        updatedUser = {
          ...updatedUser,
          dailyGoalCompletionNotified: true,
        };
      }
      dispatch(setUser(updatedUser));

      const completedSession: ISession = {
        ...timerState.session,
        spentTimeSeconds: timerState.session.totalTimeSeconds,
      };
      try {
        await updateSession(completedSession);
      } catch (e) {
        toast(t('serverErrors.updateSessionButSaved'), {
          type: 'error',
        });
        saveSessionToLS(completedSession, 'unsyncedSession');
      }

      stopTimer();
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
            session: {
              ...prev.session,
              spentTimeSeconds: ev.data,
            },
          };
        });

        if (ev.data >= timerState.session.totalTimeSeconds) {
          finishTimer();
          timerWorker.postMessage({ action: 'pause' });
          return;
        }

        // automatic timer update in local storage every 2 seconds
        if ((ev.data - startSpentSeconds.current) % 2 == 0) {
          saveSessionToLS(
            {
              ...timerState.session,
              spentTimeSeconds: ev.data,
            },
            'session'
          );
        }

        // automatic timer update on server
        let syncIntervalSeconds = 300;
        if (timerState.session.totalTimeSeconds <= 300) {
          syncIntervalSeconds = 0.2 * timerState.session.totalTimeSeconds;
        }
        if ((ev.data - startSpentSeconds.current) % syncIntervalSeconds == 0) {
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
        document.title = `${timerInTitle} ${t('title.focus')} | ${
          timerState.session.activity
            ? timerState.session.activity.name
            : t('withoutActivity')
        }`;
      } else if (timerState.status == 'paused') {
        document.title = `${timerInTitle} ${t('title.paused')} | ${
          timerState.session.activity
            ? timerState.session.activity.name
            : t('withoutActivity')
        }`;
      }
    } else {
      document.title = 'Session Tracker';
    }
  }, [timerState.status, timerState.session, currentUser]);

  return (
    <TimerContext.Provider
      value={{
        startTimer,
        toggleTimer,
        stopTimer,
        timerState,
        timerEndDate: timerEndDate.current,
        startTimestamp: startTimestamp.current,
        startSpentSeconds: startSpentSeconds.current,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export default TimerProvider;

export const useTimer = () => useContext(TimerContext);
