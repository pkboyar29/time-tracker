import { FC, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useAppDispatch } from '../redux/store';
import { useTimer } from '../context/TimerContext';
import {
  deleteSession,
  resetSessionState,
  setCurrentSession,
  updateSession,
} from '../redux/slices/sessionSlice';
import { ISession } from '../ts/interfaces/Session/ISession';

import SessionItem from './SessionItem';
import Button from '../components/Button';
import Modal from '../components/Modal';

interface SessionsListProps {
  sessions: ISession[];
  updateSessionsList: (updatedSessions: ISession[]) => void;
}

interface DeleteModalState {
  visibility: boolean;
  deletedItemId: string | null;
}

const SessionsList: FC<SessionsListProps> = ({
  sessions,
  updateSessionsList,
}) => {
  const currentSession = useSelector(
    (state: RootState) => state.sessions.currentSession
  );
  const dispatch = useAppDispatch();
  const { startTimer, stopTimer, toggleTimer, enabled } = useTimer();

  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    visibility: false,
    deletedItemId: null,
  });

  const getUpdatedSessionsListAfterUpdate = (
    updatedCurrentSession: ISession
  ): ISession[] => {
    let updatedSessions: ISession[] = [];

    if (updatedCurrentSession.completed) {
      updatedSessions = sessions.filter(
        (session) => session.id !== updatedCurrentSession.id
      );
    } else {
      updatedSessions = sessions.map((session) => {
        if (session.id === updatedCurrentSession.id) {
          return {
            ...session,
            totalTimeSeconds: updatedCurrentSession.totalTimeSeconds,
            spentTimeSeconds: updatedCurrentSession.spentTimeSeconds,
            note: updatedCurrentSession.note,
            completed: updatedCurrentSession.completed,
          };
        } else {
          return session;
        }
      });
    }

    return updatedSessions;
  };

  const getUpdatedSessionsListAfterDelete = (sessionId: string): ISession[] => {
    const sessionsUpdated = sessions.filter(
      (session) => session.id !== sessionId
    );

    return sessionsUpdated;
  };

  const handleSessionClick = async (session: ISession) => {
    if (currentSession) {
      if (enabled) {
        const actionResult = await dispatch(updateSession(currentSession));
        if (updateSession.fulfilled.match(actionResult)) {
          updateSessionsList(
            getUpdatedSessionsListAfterUpdate(actionResult.payload)
          );
        }
      }

      if (currentSession.id === session.id) {
        toggleTimer();
      } else {
        dispatch(setCurrentSession(session));
        startTimer();
      }
    } else {
      dispatch(setCurrentSession(session));
      startTimer();
    }
  };

  const handleSessionDelete = (sessionId: string) => {
    if (currentSession) {
      if (currentSession.id === sessionId) {
        stopTimer();
        dispatch(resetSessionState());
      }
    }

    dispatch(deleteSession(sessionId));

    updateSessionsList(getUpdatedSessionsListAfterDelete(sessionId));

    setDeleteModal({
      visibility: false,
      deletedItemId: null,
    });
  };

  const handleSessionDeleteClick = (sessionId: string) => {
    setDeleteModal({
      visibility: true,
      deletedItemId: sessionId,
    });
  };

  return (
    <>
      {deleteModal.visibility && (
        <Modal
          title="Deleting session"
          onCloseModal={() =>
            setDeleteModal({
              visibility: false,
              deletedItemId: null,
            })
          }
        >
          <Button
            onClick={() =>
              deleteModal.deletedItemId &&
              handleSessionDelete(deleteModal.deletedItemId)
            }
          >
            Delete session
          </Button>
        </Modal>
      )}

      {sessions.length !== 0 && (
        <div className="flex flex-col gap-5 mt-5 w-96">
          {sessions.map((session) => (
            <SessionItem
              isActive={currentSession?.id === session.id}
              isEnabled={enabled} // session.id === currentSession?.id ? enabled : undefined
              key={session.id}
              session={session}
              sessionClickHandler={handleSessionClick}
              sessionDeleteHandler={handleSessionDeleteClick}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default SessionsList;
