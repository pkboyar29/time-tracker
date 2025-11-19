import { ISession } from '../ts/interfaces/Session/ISession';

export const saveSessionToLocalStorage = (session: ISession) => {
  window.localStorage.setItem('session', JSON.stringify(session));
};

export const removeSessionFromLocalStorage = () => {
  if (window.localStorage.getItem('session')) {
    window.localStorage.removeItem('session');
  }
};

export const getSessionFromLocalStorage = (): ISession | null => {
  const unparsedSession = window.localStorage.getItem('session');
  if (!unparsedSession) {
    return null;
  }

  try {
    const session: ISession = JSON.parse(unparsedSession);
    return session;
  } catch (e) {
    removeSessionFromLocalStorage();
    return null;
  }
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
