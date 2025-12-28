import { ISession } from '../ts/interfaces/Session/ISession';

export const saveSessionToLocalStorage = (
  session: ISession,
  lsKey: 'session' | 'unsyncedSession'
) => {
  window.localStorage.setItem(lsKey, JSON.stringify(session));
};

export const removeSessionFromLocalStorage = (
  lsKey: 'session' | 'unsyncedSession'
) => {
  if (window.localStorage.getItem(lsKey)) {
    window.localStorage.removeItem(lsKey);
  }
};

export const getSessionFromLocalStorage = (
  lsKey: 'session' | 'unsyncedSession'
): ISession | null => {
  const unparsedSession = window.localStorage.getItem(lsKey);
  if (!unparsedSession) {
    return null;
  }

  try {
    const session: ISession = JSON.parse(unparsedSession);
    return session;
  } catch (e) {
    removeSessionFromLocalStorage(lsKey);
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

export const getLangFromLocalStorage = (): 'en' | 'ru' => {
  let currentLang = window.localStorage.getItem('lang');
  if (currentLang !== 'en' && currentLang != 'ru') {
    currentLang = 'en';
    window.localStorage.setItem('lang', 'en');
  }

  return currentLang as 'en' | 'ru';
};

export const setLangInLocalStorage = (lang: 'en' | 'ru') => {
  window.localStorage.setItem('lang', lang);
};
