import { useAppDispatch } from '../redux/store';
import { setCurrentSession } from '../redux/slices/sessionSlice';
import { saveSessionToLocalStorage } from '../helpers/localstorageHelpers';
import { useTimer } from './useTimer';

import { ISession } from '../ts/interfaces/Session/ISession';

export const useStartSession = () => {
  const dispatch = useAppDispatch();
  const { toggleTimer } = useTimer();

  const startSession = (session: ISession) => {
    dispatch(setCurrentSession(session));
    saveSessionToLocalStorage(session.id);
    toggleTimer(session.spentTimeSeconds); // TODO: если было enabled (не стояло на паузе), то новая выбранная сессия будет стоять в паузе
  };

  return { startSession };
};
