import { FC, useState, useEffect } from 'react';
import { useTimer } from '../hooks/useTimer';
import { deleteSession } from '../api/sessionApi';
import { getSessionIdFromLocalStorage } from '../helpers/localstorageHelpers';
import { toast } from 'react-toastify';

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
  const { timerState, startTimer } = useTimer();

  const sessionIdFromLocalStorage = getSessionIdFromLocalStorage();

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
    if (timerState.session) {
      const isCurrentSessionInList = sessions.find(
        (s) => s.id === timerState.session.id
      );

      if (isCurrentSessionInList) {
        if (
          timerState.session.spentTimeSeconds ==
          timerState.session.totalTimeSeconds
        ) {
          updateSessionsListHandler(
            sessions.filter((s) => s.id !== timerState.session.id)
          );
        } else {
          updateSessionsListHandler(
            getSessionsListAfterSessionUpdate(sessions, timerState.session)
          );
        }
      } else {
        updateSessionsListHandler([...sessions, timerState.session]);
      }
    }
  }, [timerState.session]);

  const handleSessionClick = async (session: ISession) => {
    startTimer(session);
  };

  const handleSessionDelete = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      updateSessionsListHandler(
        sessions.filter((session) => session.id !== sessionId)
      );

      setDeleteModal({
        status: false,
        selectedItemId: null,
      });
    } catch (e) {
      toast('A server error occurred while deleting session', {
        type: 'error',
      });
    }
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
                  isActive={timerState.session?.id === session.id}
                  isEnabled={timerState.status == 'running'}
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
