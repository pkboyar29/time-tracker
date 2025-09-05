export const saveSessionToLocalStorage = (sessionId: string) => {
  window.localStorage.setItem('session', sessionId);
};

export const removeSessionFromLocalStorage = () => {
  if (window.localStorage.getItem('session')) {
    window.localStorage.removeItem('session');
  }
};

export const getSessionIdFromLocalStorage = (): string | null => {
  const sessionId = window.localStorage.getItem('session');
  if (sessionId) {
    return sessionId;
  }
  return null;
};

export const getThemeFromLocalStorage = (): 'light' | 'dark' => {
  let currentTheme = window.localStorage.getItem('theme');
  if (currentTheme !== 'light' && currentTheme !== 'dark') {
    currentTheme = 'light';
    window.localStorage.setItem('theme', 'light');
  }

  return currentTheme as 'light' | 'dark';
};

export const toggleThemeInLocalStorage = () => {
  const currentTheme = getThemeFromLocalStorage();
  let newTheme = 'light';
  if (currentTheme) {
    newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  }

  window.localStorage.setItem('theme', newTheme);

  return newTheme;
};
