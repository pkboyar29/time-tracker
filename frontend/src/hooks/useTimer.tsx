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
import { updateSession } from '../api/sessionApi';
import {
  saveSessionToLS,
  removeSessionFromLS,
} from '../helpers/localstorageHelpers';
import {
  secondsToMs,
  msToSeconds,
  getTimerEndDate,
} from '../helpers/timeHelpers';
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

interface TimerContextType {
  startTimer: (session: ISession, paused?: boolean) => Promise<void>;
  toggleTimer: () => Promise<void>;
  stopTimer: (shouldUpdateSession?: boolean) => Promise<void>;
  changeTotalTimeSeconds: (newTotalTimeSeconds: number) => Promise<void>;
  timerState: TimerState;
  timerEndDate: Date;
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
  finalSpentSeconds: 0,
  finalSessionId: '',
};

const TimerContext = createContext<TimerContextType>(defaultContext);

interface TimerProviderProps {
  children: ReactNode;
}

const TimerProvider: FC<TimerProviderProps> = ({ children }) => {
  // spentTimeSeconds does not change in this state. You can use milliseconds using hook useTimerWithMs
  const [timerState, setTimerState] = useState<TimerState>({
    status: 'idle',
    session: null,
  });
  const sessionRef = useRef<ISession | null>(null);
  const [finalSpentSeconds, setFinalSpentSeconds] = useState<number>(0);
  const [finalSessionId, setFinalSessionId] = useState<string>('');

  const startTimestampRef = useRef<number>(0);
  const startSpentMsRef = useRef<number>(0);

  const lastSavedToLSMsRef = useRef<number>(0);
  const lastSavedToServerMsRef = useRef<number>(0);

  const syncIntervalMsRef = useRef<number>(1);

  const [timerEndDate, setTimerEndDate] = useState<Date>(new Date()); // here we store date when timer is going to end

  const { t } = useTranslation();
  const { playAudio, stopAudio } = useAudioPlayer();

  const startTimer = async (session: ISession, paused?: boolean) => {
    if (timerState.status === 'running') {
      try {
        await updateSession(
          {
            ...timerState.session,
            spentTimeSeconds: msToSeconds(timerTickStore.getSnapshot().ms),
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
      startTimestampRef.current = Date.now();
      startSpentMsRef.current = secondsToMs(session.spentTimeSeconds);

      lastSavedToLSMsRef.current = 0;
      lastSavedToServerMsRef.current = 0;

      setTimerState({ status: 'running', session });
    }

    timerTickStore.setTick(session.id, secondsToMs(session.spentTimeSeconds));
  };

  const toggleTimer = async () => {
    if (timerState.status == 'running') {
      startTimestampRef.current = 0;
      startSpentMsRef.current = 0;

      lastSavedToLSMsRef.current = 0;
      lastSavedToServerMsRef.current = 0;

      setTimerState({ session: timerState.session, status: 'paused' });

      const sessionToUpdate: ISession = {
        ...timerState.session,
        spentTimeSeconds: msToSeconds(timerTickStore.getSnapshot().ms),
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
      startTimestampRef.current = Date.now();
      startSpentMsRef.current = timerTickStore.getSnapshot().ms;

      lastSavedToLSMsRef.current = 0;
      lastSavedToServerMsRef.current = 0;

      setTimerState({ session: timerState.session, status: 'running' });
    }
  };

  const changeTotalTimeSeconds = async (newTotalTimeSeconds: number) => {
    if (timerState.status === 'idle') return;

    const oldTotalTimeSeconds = timerState.session.totalTimeSeconds; // TODO: если мы к старому состоянию при ошибке возвращаться не будем, то delete
    const sessionToUpdate: ISession = {
      ...timerState.session,
      totalTimeSeconds: newTotalTimeSeconds,
      spentTimeSeconds: msToSeconds(timerTickStore.getSnapshot().ms),
    };

    setTimerState({ session: sessionToUpdate, status: timerState.status });

    try {
      await updateSession(sessionToUpdate, false);

      // TODO: если произошла ошибка, то в LS мы ничего не сохраняем?
      saveSessionToLS(sessionToUpdate, 'session');
    } catch (e) {
      // TODO: показывать serverErrors.updateSessionButSaved и не возвращать состояние обратно
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
      spentTimeSeconds: msToSeconds(timerTickStore.getSnapshot().ms),
    };
    setFinalSpentSeconds(sessionToUpdate.spentTimeSeconds);
    setFinalSessionId(sessionToUpdate.id);

    setTimerState({ status: 'idle', session: null });
    timerTickStore.setTick('', 0);
    startTimestampRef.current = 0;
    startSpentMsRef.current = 0;
    lastSavedToLSMsRef.current = 0;
    lastSavedToServerMsRef.current = 0;
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

    showSessionCompletedNotification({
      session: completedSession,
      onClose: stopAudio,
    });
  };

  useEffect(() => {
    sessionRef.current = timerState.session;
  }, [timerState]);

  useEffect(() => {
    if (timerState.status === 'running') {
      let intervalMs = secondsToMs(300); // 5 min
      if (timerState.session.totalTimeSeconds <= 300) {
        intervalMs = 0.2 * secondsToMs(timerState.session.totalTimeSeconds);
      }

      syncIntervalMsRef.current = intervalMs;
    } else {
      syncIntervalMsRef.current = 0;
    }
  }, [timerState.status, timerState.session?.totalTimeSeconds]);

  useEffect(() => {
    if (timerState.status === 'running') {
      setTimerEndDate(
        getTimerEndDate(
          Date.now(),
          msToSeconds(timerTickStore.getSnapshot().ms),
          timerState.session.totalTimeSeconds,
        ),
      );
    }
  }, [timerState.status, timerState.session?.totalTimeSeconds]);

  useEffect(() => {
    if (timerState.status == 'running') {
      timerWorker.postMessage({
        startTimestamp: startTimestampRef.current,
        startSpentMs: startSpentMsRef.current,
        action: 'run',
      });

      timerWorker.onmessage = (ev) => {
        if (!sessionRef.current) return;

        timerTickStore.setTick(sessionRef.current.id, ev.data);

        // TODO: в объекте session можно хранить totalTimeMs для того, чтобы было меньше вычислений. Также это надо будет изменять в changeTotalTimeSeconds
        if (ev.data >= secondsToMs(sessionRef.current.totalTimeSeconds)) {
          finishTimer();
          timerWorker.postMessage({ action: 'pause' });
          return;
        }

        const diff = ev.data - startSpentMsRef.current;

        // automatic timer update in local storage every 2 seconds
        if (diff - lastSavedToLSMsRef.current >= 2000) {
          lastSavedToLSMsRef.current += 2000;

          saveSessionToLS(
            { ...sessionRef.current, spentTimeSeconds: msToSeconds(ev.data) },
            'session',
          );
        }

        // automatic timer update on server
        if (
          diff - lastSavedToServerMsRef.current >=
          syncIntervalMsRef.current
        ) {
          lastSavedToServerMsRef.current += syncIntervalMsRef.current;

          updateSession({
            ...sessionRef.current,
            spentTimeSeconds: msToSeconds(ev.data),
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
        timerEndDate,
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

type TimerStateWithMs = TimerContextType['timerState'] & {
  ms: number;
};

type TimerContextWithMs = Omit<TimerContextType, 'timerState'> & {
  timerState: TimerStateWithMs;
};

export const useTimerWithMs = (): TimerContextWithMs => {
  const context = useContext(TimerContext);
  const session = context.timerState.session;

  const currentTick = useSyncExternalStore(
    timerTickStore.subscribe,
    timerTickStore.getSnapshot,
  );

  // TODO: если currentTick.sessionId !== session.id, то мы просто вернем 0. Это неправильно
  return {
    ...context,
    timerState: {
      ...context.timerState,
      ms: currentTick.sessionId === session?.id ? currentTick.ms : 0,
    },
  };
};
