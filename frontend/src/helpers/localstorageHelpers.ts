const saveSessionToLocalStorage = (sessionId: string) => {
  window.localStorage.setItem('session', sessionId);
};

const removeSessionFromLocalStorage = () => {
  if (window.localStorage.getItem('session')) {
    window.localStorage.removeItem('session');
  }
};

const getSessionFromLocalStorage = (): string | null => {
  const sessionId = window.localStorage.getItem('session');
  if (sessionId) {
    return sessionId;
  }
  return null;
};

export {
  saveSessionToLocalStorage,
  removeSessionFromLocalStorage,
  getSessionFromLocalStorage,
};
