type TimerTick = {
  sessionId: string;
  ms: number;
};

let state: TimerTick = {
  sessionId: '',
  ms: 0,
};
const listeners = new Set<() => void>();

export const timerTickStore = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setTick: (sessionId: string, ms: number) => {
    state = { sessionId, ms };
    listeners.forEach((l) => l());
  },
};
