import { ISession } from '../ts/interfaces/Session/ISession';

const saveSessionToLocalStorage = (session: ISession) => {
  const sessionJson = JSON.stringify(session);
  window.localStorage.setItem('session', sessionJson);
};

const removeSessionFromLocalStorage = () => {
  if (window.localStorage.getItem('session')) {
    window.localStorage.removeItem('session');
  }
};

const loadSessionFromLocalStorage = (): ISession | null => {
  const sessionJson = window.localStorage.getItem('session');
  if (sessionJson) {
    // TODO: обработать ошибку когда в session хранится не сессия в формате json, а непонятно что
    // да и вообще надо попытаться запретить изменение local storage, но по-моему это невозможно
    // в любом случае, если десериализовать не получится, то очистить полностью local storage и в консоль можно вывести сообщение
    const session: ISession = JSON.parse(sessionJson);

    return session;
  }
  return null;
};

export {
  saveSessionToLocalStorage,
  removeSessionFromLocalStorage,
  loadSessionFromLocalStorage,
};
