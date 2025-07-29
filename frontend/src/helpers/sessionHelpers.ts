import { ISession } from '../ts/interfaces/Session/ISession';

export const getSessionsListAfterSessionUpdate = (
  oldList: ISession[],
  updatedSession: ISession
) => {
  return oldList.map((session) =>
    updatedSession.id == session.id ? updatedSession : session
  );
};
