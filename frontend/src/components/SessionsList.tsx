import { FC, useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { useTimer } from '../hooks/useTimer';
import { useStartSession } from '../hooks/useStartSession';
import { deleteSession, updateSession } from '../redux/slices/sessionSlice';
import { getSessionIdFromLocalStorage } from '../helpers/localstorageHelpers';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SessionItem from './SessionItem';
import Button from '../components/Button';
import Modal from './modals/Modal';

import { ISession } from '../ts/interfaces/Session/ISession';
import { ModalState } from '../ts/interfaces/ModalState';

interface SessionsListProps {
  title: string;
  sessions: ISession[];
  updateSessionsListHandler: (updatedSessions: ISession[]) => void;
}

const getSessionsListAfterSessionUpdate = (
  oldList: ISession[],
  updatedSession: ISession
) => {
  return oldList.map((session) =>
    updatedSession.id == session.id ? updatedSession : session
  );
};

const SessionsList: FC<SessionsListProps> = ({
  title,
  sessions,
  updateSessionsListHandler,
}) => {
  const dispatch = useAppDispatch();
  const { timerState } = useTimer();
  const { startSession } = useStartSession();

  const sessionIdFromLocalStorage = getSessionIdFromLocalStorage();
  const currentSession = useAppSelector(
    (state) => state.sessions.currentSession
  );
  const lastCompletedSessionId = useAppSelector(
    (state) => state.sessions.lastCompletedSessionId
  );

  // removing current session from the list
  const sessionsWithoutCurrent = sessions.filter(
    (session) => session.id !== sessionIdFromLocalStorage
  );

  const [deleteModal, setDeleteModal] = useState<ModalState>({
    status: false,
    selectedItemId: null,
  });

  const [less, setLess] = useState<boolean>(false); // less - true, more - false

  useEffect(() => {
    if (currentSession) {
      const isCurrentSessionInList = sessions.find(
        (s) => s.id === currentSession.id
      );

      if (isCurrentSessionInList) {
        updateSessionsListHandler(
          getSessionsListAfterSessionUpdate(sessions, currentSession)
        );
      } else {
        updateSessionsListHandler([...sessions, currentSession]);
      }
    }
  }, [currentSession]);

  useEffect(() => {
    if (lastCompletedSessionId) {
      updateSessionsListHandler(
        sessions.filter((s) => s.id !== lastCompletedSessionId)
      );
    }
  }, [lastCompletedSessionId]);

  const handleSessionClick = async (session: ISession) => {
    // updating the previous current session if it's not paused
    if (currentSession && timerState == 'running') {
      try {
        const updatedSession = await dispatch(
          updateSession(currentSession)
        ).unwrap();

        updateSessionsListHandler(
          getSessionsListAfterSessionUpdate(sessions, updatedSession)
        );
      } catch (e) {
        // TODO: сообщать в тосте, что не удалось обновить сессию
        console.log(e);
      }
    }

    startSession(session);
  };

  const handleSessionDelete = (sessionId: string) => {
    dispatch(deleteSession(sessionId));
    updateSessionsListHandler(
      sessions.filter((session) => session.id !== sessionId)
    );

    setDeleteModal({
      status: false,
      selectedItemId: null,
    });
  };

  const handleSessionDeleteClick = (sessionId: string) => {
    setDeleteModal({
      status: true,
      selectedItemId: sessionId,
    });
  };

  return (
    <>
      {deleteModal.status && (
        <Modal
          title="Deleting session"
          onCloseModal={() =>
            setDeleteModal({
              status: false,
              selectedItemId: null,
            })
          }
        >
          <p className="text-base/6 dark:text-textDark">
            Are you sure you want to delete this session? The time spent on this
            session will not be included in analytics.
          </p>

          <div className="mt-10 ml-auto w-fit">
            <Button
              onClick={() =>
                deleteModal.selectedItemId &&
                handleSessionDelete(deleteModal.selectedItemId)
              }
            >
              Delete session
            </Button>
          </div>
        </Modal>
      )}

      {sessionsWithoutCurrent.length !== 0 && (
        <div className="flex flex-col items-end ml-auto">
          <button
            onClick={() => setLess(!less)}
            className="flex dark:text-textDark items-center justify-end gap-1 my-5 text-xl font-bold bg-surfaceLight dark:bg-backgroundDark z-[5000] w-full"
          >
            {title}
            {less ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </button>

          {!less && (
            <div
              className={`flex flex-col gap-5 w-96 overflow-y-auto overflow-x-hidden`}
            >
              {sessionsWithoutCurrent.map((session) => (
                <SessionItem
                  isActive={currentSession?.id === session.id}
                  isEnabled={timerState == 'running'}
                  key={session.id}
                  session={session}
                  sessionClickHandler={handleSessionClick}
                  sessionDeleteHandler={handleSessionDeleteClick}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SessionsList;
