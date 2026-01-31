import { TimerTick } from './useTimer';

let state: TimerTick = {
  sessionId: '',
  seconds: 0,
};
const listeners = new Set<() => void>();

export const timerTickStore = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setTick: (sessionId: string, seconds: number) => {
    state = { sessionId, seconds };
    listeners.forEach((l) => l());
  },
};
