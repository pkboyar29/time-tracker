import {
  createContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
  FC,
  useContext,
  useSyncExternalStore,
} from 'react';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { setUser } from '../redux/slices/userSlice';
import { updateSession } from '../api/sessionApi';
import {
  saveSessionToLS,
  removeSessionFromLS,
} from '../helpers/localstorageHelpers';
import { getTimerEndDate } from '../helpers/timeHelpers';
import { showSessionCompletedNotification } from '../helpers/notificationHelpers';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAudioPlayer } from './useAudioPlayer';
import { timerTickStore } from './timerTickStore';

import { ISession } from '../ts/interfaces/Session/ISession';

const timerWorker = new Worker(new URL('./timerWorker.js', import.meta.url));

type TimerState =
  | { status: 'idle'; session: null }
  | { status: 'running' | 'paused'; session: ISession };

export type TimerTick = {
  sessionId: string;
  seconds: number;
};

interface TimerContextType {
  startTimer: (session: ISession, paused?: boolean) => Promise<void>;
  toggleTimer: () => Promise<void>;
  stopTimer: (shouldUpdateSession?: boolean) => Promise<void>;
  changeTotalTimeSeconds: (newTotalTimeSeconds: number) => Promise<void>;
  timerState: TimerState;
  timerEndDate: Date;
  startTimestamp: number;
  startSpentSeconds: number;
  finalSpentSeconds: number;
  finalSessionId: string;
}

const defaultContext: TimerContextType = {
  startTimer: async () => {},
  toggleTimer: async () => {},
  stopTimer: async () => {},
  changeTotalTimeSeconds: async () => {},
  timerState: { status: 'idle', session: null },
  timerEndDate: new Date(),
  startTimestamp: 0,
  startSpentSeconds: 0,
  finalSpentSeconds: 0,
  finalSessionId: '',
};

const TimerContext = createContext<TimerContextType>(defaultContext);

interface TimerProviderProps {
  children: ReactNode;
}

const TimerProvider: FC<TimerProviderProps> = ({ children }) => {
  // spentTimeSeconds does change every second only when using useTimerWithSeconds
  const [timerState, setTimerState] = useState<TimerState>({
    status: 'idle',
    session: null,
  });
  const sessionRef = useRef<ISession | null>(null);
  const [finalSpentSeconds, setFinalSpentSeconds] = useState<number>(0);
  const [finalSessionId, setFinalSessionId] = useState<string>('');

  const startTimestamp = useRef<number>(0); // here we store timestamp
  const startSpentSeconds = useRef<number>(0); // here we store seconds

  const timerEndDate = useRef<Date>(new Date()); // here we store date when timer is going to end

  const currentUser = useAppSelector((state) => state.users.user);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { playAudio, stopAudio } = useAudioPlayer();

  const startTimer = async (session: ISession, paused?: boolean) => {
    if (timerState.status == 'running') {
      try {
        await updateSession(
          {
            ...timerState.session,
            spentTimeSeconds: timerTickStore.getSnapshot().seconds,
          },
          true,
        );
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
        session.totalTimeSeconds,
      );

      setTimerState({ status: 'running', session });
    }

    timerTickStore.setTick(session.id, session.spentTimeSeconds);
  };

  const toggleTimer = async () => {
    if (timerState.status == 'running') {
      startTimestamp.current = 0;
      startSpentSeconds.current = 0;

      setTimerState({ session: timerState.session, status: 'paused' });

      const sessionToUpdate: ISession = {
        ...timerState.session,
        spentTimeSeconds: timerTickStore.getSnapshot().seconds,
      };
      setFinalSpentSeconds(sessionToUpdate.spentTimeSeconds);
      setFinalSessionId(sessionToUpdate.id);

      try {
        await updateSession(sessionToUpdate, true);
      } catch (e) {
        toast(t('serverErrors.updateSessionButSaved'), {
          type: 'error',
        });
      }
    } else if (timerState.status == 'paused') {
      const newStartTimestamp = Date.now();
      startTimestamp.current = newStartTimestamp;
      startSpentSeconds.current = timerTickStore.getSnapshot().seconds;

      timerEndDate.current = getTimerEndDate(
        newStartTimestamp,
        timerTickStore.getSnapshot().seconds,
        timerState.session.totalTimeSeconds,
      );

      setTimerState({ session: timerState.session, status: 'running' });
    }
  };

  const changeTotalTimeSeconds = async (newTotalTimeSeconds: number) => {
    if (timerState.status === 'idle') return;

    const oldTotalTimeSeconds = timerState.session.totalTimeSeconds;
    const sessionToUpdate: ISession = {
      ...timerState.session,
      totalTimeSeconds: newTotalTimeSeconds,
      spentTimeSeconds: timerTickStore.getSnapshot().seconds,
    };
    setTimerState({ session: sessionToUpdate, status: timerState.status });

    try {
      await updateSession(sessionToUpdate, false);

      saveSessionToLS(sessionToUpdate, 'session');
    } catch (e) {
      toast(t('serverErrors.updateSession'), {
        type: 'error',
      });

      setTimerState({
        session: { ...sessionToUpdate, totalTimeSeconds: oldTotalTimeSeconds },
        status: timerState.status,
      });
    }
  };

  const stopTimer = async (shouldUpdateSession?: boolean) => {
    if (timerState.status === 'idle') return;

    const sessionToUpdate: ISession = {
      ...timerState.session,
      spentTimeSeconds: timerTickStore.getSnapshot().seconds,
    };
    setFinalSpentSeconds(sessionToUpdate.spentTimeSeconds);
    setFinalSessionId(sessionToUpdate.id);

    setTimerState({ status: 'idle', session: null });
    timerTickStore.setTick('', 0);
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
        saveSessionToLS(sessionToUpdate, 'unsyncedSession');
      }
    }
  };

  const finishTimer = async () => {
    if (timerState.status === 'idle') return;
    if (!sessionRef.current) return;

    const completedSession: ISession = {
      ...sessionRef.current,
      spentTimeSeconds: sessionRef.current.totalTimeSeconds,
    };
    stopTimer();

    try {
      await updateSession(completedSession);
    } catch (e) {
      toast(t('serverErrors.updateSessionButSaved'), {
        type: 'error',
      });
      saveSessionToLS(completedSession, 'unsyncedSession');
    }

    playAudio();

    if (!currentUser) {
      showSessionCompletedNotification({
        session: completedSession,
        onClose: stopAudio,
      });
      return;
    }

    let updatedUser = {
      ...currentUser,
      // TODO: вот мы завершили сессию на половину, обновили страницу, в todaySpentTimeSeconds времени уже больше, и мы к этому значению прибавляем totalTimeSeconds? вообще не та цифра будет
      todaySpentTimeSeconds:
        currentUser.todaySpentTimeSeconds + completedSession.totalTimeSeconds,
    };
    const isDailyGoalCompleted =
      updatedUser.todaySpentTimeSeconds >= updatedUser.dailyGoal;

    showSessionCompletedNotification({
      session: completedSession,
      dailyGoalCompleted:
        isDailyGoalCompleted && !updatedUser.dailyGoalCompletionNotified,
      onClose: stopAudio,
    });

    if (isDailyGoalCompleted) {
      updatedUser = {
        ...updatedUser,
        dailyGoalCompletionNotified: true,
      };
    }
    dispatch(setUser(updatedUser));
  };

  useEffect(() => {
    sessionRef.current = timerState.session;
  }, [timerState]);

  useEffect(() => {
    if (timerState.status == 'running') {
      timerWorker.postMessage({
        startTimestamp: startTimestamp.current,
        startSpentSeconds: startSpentSeconds.current,
        action: 'run',
      });

      timerWorker.onmessage = (ev) => {
        if (!sessionRef.current) return;

        timerTickStore.setTick(sessionRef.current.id, ev.data);

        if (ev.data >= sessionRef.current.totalTimeSeconds) {
          finishTimer();
          timerWorker.postMessage({ action: 'pause' });
          return;
        }

        // automatic timer update in local storage every 2 seconds
        if ((ev.data - startSpentSeconds.current) % 2 == 0) {
          saveSessionToLS(
            {
              ...sessionRef.current,
              spentTimeSeconds: ev.data,
            },
            'session',
          );
        }

        // automatic timer update on server
        let syncIntervalSeconds = 300;
        if (sessionRef.current.totalTimeSeconds <= 300) {
          syncIntervalSeconds = 0.2 * sessionRef.current.totalTimeSeconds;
        }
        if ((ev.data - startSpentSeconds.current) % syncIntervalSeconds == 0) {
          updateSession({
            ...sessionRef.current,
            spentTimeSeconds: ev.data,
          });
        }
      };
    } else {
      // if status is paused or idle
      timerWorker.postMessage({ action: 'pause' });
    }
  }, [timerState.status, timerState.session?.id]);

  return (
    <TimerContext.Provider
      value={{
        startTimer,
        toggleTimer,
        changeTotalTimeSeconds,
        stopTimer,
        timerState,
        timerEndDate: timerEndDate.current,
        startTimestamp: startTimestamp.current,
        startSpentSeconds: startSpentSeconds.current,
        finalSpentSeconds,
        finalSessionId,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export default TimerProvider;

export const useTimer = (): TimerContextType => {
  return useContext(TimerContext);
};

export const useTimerWithSeconds = (): TimerContextType => {
  const context = useContext(TimerContext);
  const session = context.timerState.session;

  const currentTick = useSyncExternalStore(
    timerTickStore.subscribe,
    timerTickStore.getSnapshot,
  );

  // TODO: второе условие странное, так как возвращая context, мы возвращаем старые данные, потому что в context секунды не обновляются
  if (!session || currentTick.sessionId !== session.id) {
    return context;
  }

  return {
    ...context,
    timerState: {
      ...context.timerState,
      session: {
        ...session,
        spentTimeSeconds: currentTick.seconds,
      },
    },
  };
};
