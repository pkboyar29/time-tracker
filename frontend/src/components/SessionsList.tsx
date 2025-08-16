import { FC, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { useTimer } from '../context/TimerContext';
import {
  deleteSession,
  setCurrentSession,
  updateSession,
} from '../redux/slices/sessionSlice';
import { saveSessionToLocalStorage } from '../helpers/localstorageHelpers';
import { getSessionsListAfterSessionUpdate } from '../helpers/sessionHelpers';

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

const SessionsList: FC<SessionsListProps> = ({
  title,
  sessions,
  updateSessionsListHandler,
}) => {
  const dispatch = useAppDispatch();
  const { stopTimer, toggleTimer, enabled } = useTimer();

  const currentSession = useAppSelector(
    (state) => state.sessions.currentSession
  );
  // removing current session from the list
  const filteredSessions = sessions.filter(
    (session) => session.id !== currentSession?.id
  );

  const [deleteModal, setDeleteModal] = useState<ModalState>({
    status: false,
    selectedItemId: null,
  });

  const [less, setLess] = useState<boolean>(false); // less - true, more - false

  const handleSessionClick = async (session: ISession) => {
    if (currentSession) {
      // updating the previous session if it's not paused
      if (enabled) {
        try {
          const updatedSession = await dispatch(
            updateSession(currentSession)
          ).unwrap();

          updateSessionsListHandler(
            getSessionsListAfterSessionUpdate(sessions, updatedSession)
          );
        } catch (e) {
          console.log(e);
        }
      }

      dispatch(setCurrentSession(session));
      saveSessionToLocalStorage(session.id);
      // TODO: если было enabled (не стояло на паузе), то новая выбранная сессия будет стоять в паузе
      toggleTimer(session.spentTimeSeconds);
    } else {
      dispatch(setCurrentSession(session));
      saveSessionToLocalStorage(session.id);
      toggleTimer(session.spentTimeSeconds);
    }
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
          <p className="mb-4 text-[15px]">
            Are you sure you want to delete this session?
          </p>
          <Button
            onClick={() =>
              deleteModal.selectedItemId &&
              handleSessionDelete(deleteModal.selectedItemId)
            }
          >
            Delete session
          </Button>
        </Modal>
      )}

      {filteredSessions.length !== 0 && (
        <div className="flex flex-col items-end">
          <button
            onClick={() => setLess(!less)}
            className="sticky top-0 flex items-center justify-end gap-1 my-5 text-xl font-bold bg-white z-[5000] w-full"
          >
            {title}
            {less ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </button>

          {!less && (
            <div className="flex flex-col gap-5 mt-5 w-96">
              {filteredSessions.map((session) => (
                <SessionItem
                  isActive={currentSession?.id === session.id}
                  isEnabled={enabled}
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
