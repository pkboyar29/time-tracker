import { FC, useState, useEffect } from 'react';
import { useTimerWithSeconds } from '../hooks/useTimer';
import { deleteSession } from '../api/sessionApi';
import { getSessionFromLS } from '../helpers/localstorageHelpers';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SessionItem from './SessionItem';
import Button from './common/Button';
import Modal from './modals/Modal';

import { ISession } from '../ts/interfaces/Session/ISession';
import { ModalState } from '../ts/interfaces/ModalState';

interface SessionsListProps {
  title: string;
  classname?: string;
  setIsSessionsBlockOpen?: (state: boolean) => void;
  isExpandable: boolean;
  sessions: ISession[];
  updateSessionsListHandler: (
    updater: (prev: ISession[]) => ISession[],
  ) => void;
}

const SessionsList: FC<SessionsListProps> = ({
  title,
  classname,
  setIsSessionsBlockOpen,
  isExpandable,
  sessions,
  updateSessionsListHandler,
}) => {
  const { t } = useTranslation();

  const { timerState, startTimer, stopTimer } = useTimerWithSeconds();
  const sessionFromLS = getSessionFromLS('session');

  // removing current session from the list
  const sessionsWithoutCurrent = sessions.filter(
    (session) => session.id !== sessionFromLS?.id,
  );

  const [deleteModal, setDeleteModal] = useState<ModalState>({
    status: false,
    selectedItemId: null,
  });

  const [less, setLess] = useState<boolean>(false); // less - true, more - false

  useEffect(() => {
    if (!timerState.session) {
      return;
    }
    const currentSession = timerState.session;

    updateSessionsListHandler((prev) => {
      const currentSessionIndex = prev.findIndex(
        (s) => s.id === currentSession.id,
      );

      if (currentSessionIndex !== -1) {
        if (
          currentSession.spentTimeSeconds >= currentSession.totalTimeSeconds
        ) {
          return prev.filter((s) => s.id !== currentSession.id);
        } else {
          return prev.map((s) => {
            if (s.id === currentSession.id) {
              return currentSession;
            } else {
              return s;
            }
          });
        }
      }

      return [...prev, currentSession];
    });
  }, [timerState.session?.id, timerState.session?.spentTimeSeconds]);

  const handleSessionClick = async (session: ISession) => {
    startTimer(session);

    if (setIsSessionsBlockOpen) {
      setIsSessionsBlockOpen(false);
    }
  };

  const handleSessionDelete = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      updateSessionsListHandler((prev) =>
        prev.filter((s) => s.id !== sessionId),
      );

      setDeleteModal({
        status: false,
        selectedItemId: null,
      });
    } catch (e) {
      toast(t('serverErrors.deleteSession'), {
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
          title={t('deleteSessionModal.title')}
          modalClassnames="basis-5/6 md:basis-5/6"
          onCloseModal={() =>
            setDeleteModal({
              status: false,
              selectedItemId: null,
            })
          }
        >
          <p className="text-base/6 dark:text-textDark">
            {t('deleteSessionModal.descr')}
          </p>

          <div className="mt-10 ml-auto w-fit">
            <Button
              onClick={() =>
                deleteModal.selectedItemId &&
                handleSessionDelete(deleteModal.selectedItemId)
              }
            >
              {t('deleteSessionModal.button')}
            </Button>
          </div>
        </Modal>
      )}

      {sessionsWithoutCurrent.length !== 0 && (
        <div className={`flex flex-col items-end ml-auto ${classname}`}>
          {isExpandable && (
            <button
              onClick={() => setLess(!less)}
              className="z-30 flex items-center justify-end w-full gap-1 my-5 text-xl font-bold dark:text-textDark bg-surfaceLight dark:bg-backgroundDark"
            >
              {title}
              {less ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </button>
          )}

          {!less && (
            <div className="w-full overflow-x-hidden overflow-y-auto">
              <div
                className={`flex flex-col gap-5 w-full min-[400px]:w-96 ml-auto mr-1.5`}
              >
                {sessionsWithoutCurrent.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    sessionClickHandler={handleSessionClick}
                    sessionDeleteHandler={handleSessionDeleteClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SessionsList;
