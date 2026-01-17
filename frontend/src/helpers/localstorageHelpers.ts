import { ISession } from '../ts/interfaces/Session/ISession';

export const saveSessionToLS = (
  session: ISession,
  lsKey: 'session' | 'unsyncedSession'
) => {
  window.localStorage.setItem(lsKey, JSON.stringify(session));
};

export const removeSessionFromLS = (lsKey: 'session' | 'unsyncedSession') => {
  if (window.localStorage.getItem(lsKey)) {
    window.localStorage.removeItem(lsKey);
  }
};

export const getSessionFromLS = (
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
    removeSessionFromLS(lsKey);
    return null;
  }
};

export const getThemeFromLS = (): 'light' | 'dark' => {
  let currentTheme = window.localStorage.getItem('theme');
  if (currentTheme !== 'light' && currentTheme !== 'dark') {
    currentTheme = 'light';
    window.localStorage.setItem('theme', 'light');
  }

  return currentTheme as 'light' | 'dark';
};

export const toggleThemeInLS = () => {
  const currentTheme = getThemeFromLS();
  let newTheme = 'light';
  if (currentTheme) {
    newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  }

  window.localStorage.setItem('theme', newTheme);

  return newTheme;
};

export const getLangFromLS = (): 'en' | 'ru' => {
  let currentLang = window.localStorage.getItem('lang');
  if (currentLang !== 'en' && currentLang != 'ru') {
    currentLang = 'en';
    window.localStorage.setItem('lang', 'en');
  }

  return currentLang as 'en' | 'ru';
};

export const setLangInLS = (lang: 'en' | 'ru') => {
  window.localStorage.setItem('lang', lang);
};

export const getNoteFromLS = (sessionId: string): string => {
  const sessionNote = window.localStorage.getItem(`sessionNote:${sessionId}`);

  return sessionNote ? sessionNote : '';
};

export const setNoteInLS = (sessionId: string, note: string) => {
  window.localStorage.setItem(`sessionNote:${sessionId}`, note);
};

export const removeNoteFromLS = (sessionId: string) => {
  window.localStorage.removeItem(`sessionNote:${sessionId}`);
};

export const getActivityFromLS = (): string => {
  return window.localStorage.getItem('activity') ?? '';
};

export const setActivityInLS = (activityId: string) => {
  window.localStorage.setItem('activity', activityId);
};

export const getSelectedSecondsFromLS = (): number => {
  const selectedSecondsFromLS = window.localStorage.getItem('selectedSeconds');

  let selectedSeconds;
  if (!selectedSecondsFromLS) {
    selectedSeconds = 1500;
  } else {
    selectedSeconds = Number(selectedSecondsFromLS);

    if (
      isNaN(selectedSeconds) ||
      selectedSeconds <= 0 ||
      selectedSeconds > 36_000
    ) {
      selectedSeconds = 1500;
      setSelectedSecondsInLS(1500);
    }
  }

  return selectedSeconds;
};

export const setSelectedSecondsInLS = (selectedSeconds: number) => {
  window.localStorage.setItem('selectedSeconds', selectedSeconds.toString());
};

export const getVolumeFromLS = (): number => {
  const volumeFromLS = window.localStorage.getItem('volume');

  let volume;
  if (!volumeFromLS) {
    volume = 35;
  } else {
    volume = Number(volumeFromLS);

    if (isNaN(volume) || volume < 0 || volume > 100) {
      volume = 35;
      setVolumeInLS(35);
    }
  }

  return volume;
};

export const setVolumeInLS = (volume: number) => {
  window.localStorage.setItem('volume', volume.toString());
};
