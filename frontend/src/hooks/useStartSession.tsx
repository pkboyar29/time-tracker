import { useAppDispatch } from '../redux/store';
import { setCurrentSession } from '../redux/slices/sessionSlice';
import { saveSessionToLocalStorage } from '../helpers/localstorageHelpers';
import { useTimer } from './useTimer';

import { ISession } from '../ts/interfaces/Session/ISession';

export const useStartSession = () => {
  const dispatch = useAppDispatch();
  const { startTimer } = useTimer();

  const startSession = (session: ISession) => {
    dispatch(setCurrentSession(session));
    saveSessionToLocalStorage(session.id);
    startTimer(session.spentTimeSeconds, session.totalTimeSeconds);
  };

  return { startSession };
};
