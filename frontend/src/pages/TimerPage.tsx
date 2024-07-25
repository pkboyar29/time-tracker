import { FC, useEffect, useState } from 'react';
import audioUrl from '../assets/audio.mp3';
import {
  fetchSessions,
  updateSession,
  deleteSession,
  setCurrentSessionById,
  removeCurrentSession,
  addSecond,
} from '../redux/slices/sessionSlice';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { getRemainingTimeMinutesSeconds } from '../utils/timerHelpers';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import SessionItem from '../components/SessionItem';
import SessionCreateForm from '../components/forms/SessionCreateForm';
import Button from '../components/Button';
import Modal from '../components/Modal';

const TimerPage: FC = () => {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [createModal, setCreateModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<string | null>(null); // we store here id of session we want to delete or null
  const [uncompletedLess, setUnompletedLess] = useState<boolean>(false); // less - true, more - false
  const [completedLess, setCompletedLess] = useState<boolean>(false); // less - true, more - false

  const sessions = useSelector((state: RootState) => state.sessions.sessions);
  const currentSession = useSelector(
    (state: RootState) => state.sessions.currentSession
  );
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchSessions());
  }, []);

  const toggleTimer = () => {
    setEnabled((e) => !e);
    if (enabled) {
      if (currentSession) {
        dispatch(updateSession(currentSession));
      }
    }
  };

  const startTimer = () => {
    setEnabled(true);
  };

  const stopTimer = () => {
    setEnabled(false);
    dispatch(removeCurrentSession());
    if (currentSession) {
      dispatch(updateSession(currentSession));
    }
  };

  useEffect(() => {
    if (!enabled) return;
    const intervalId = setInterval(() => {
      dispatch(addSecond());
    }, 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, [enabled]);

  useEffect(() => {
    if (currentSession) {
      if (currentSession.spentTimeSeconds === currentSession.totalTimeSeconds) {
        const audio = new Audio(audioUrl);
        audio.volume = 0.35;
        audio.play();
        // alert('Count down')
        stopTimer();
      }
    }
  }, [currentSession?.spentTimeSeconds]);

  const onSessionClick = (sessionId: string) => {
    dispatch(setCurrentSessionById(sessionId));
    setEnabled(true);
  };

  const onDeleteSessionClick = (sessionId: string) => {
    if (currentSession?.id === sessionId) {
      dispatch(removeCurrentSession());
      stopTimer();
    }
    setDeleteModal(null);
    dispatch(deleteSession(sessionId));
  };

  return (
    <>
      {createModal && (
        <Modal
          title="Creating new session"
          onCloseModal={() => setCreateModal(false)}
        >
          <SessionCreateForm
            afterSubmitHandler={() => {
              startTimer();
              setCreateModal(false);
            }}
          />
        </Modal>
      )}

      {deleteModal && (
        <Modal
          title="Deleting session"
          onCloseModal={() => setDeleteModal(null)}
        >
          <button
            onClick={() => onDeleteSessionClick(deleteModal)}
            className="p-3 text-white bg-red-500 rounded-xl"
          >
            Delete session
          </button>
        </Modal>
      )}

      <div className="container flex justify-between">
        <div className="flex flex-col items-start">
          <button
            onClick={() => setUnompletedLess(!uncompletedLess)}
            className="flex items-center gap-1 my-5 text-xl font-bold"
          >
            Uncompleted sessions{' '}
            {uncompletedLess ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </button>
          {!uncompletedLess && (
            <div className="inline-flex flex-col gap-2">
              {sessions
                .filter((session: ISession) => !session.completed)
                .map((session: ISession) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    sessionClickHandler={onSessionClick}
                    sessionDeleteHandler={onDeleteSessionClick}
                  />
                ))}
            </div>
          )}
          <button
            onClick={() => setCompletedLess(!completedLess)}
            className="flex items-center gap-1 my-5 text-xl font-bold"
          >
            Completed sessions{' '}
            {completedLess ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </button>
          {!completedLess && (
            <div className="inline-flex flex-col gap-2">
              {sessions
                .filter((session: ISession) => session.completed)
                .map((session: ISession) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    sessionDeleteHandler={onDeleteSessionClick}
                  />
                ))}
            </div>
          )}
        </div>
        <div>
          <Button onClick={() => setCreateModal(true)}>
            Create new session
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center mt-60">
        {!currentSession ? (
          <div className="text-2xl font-semibold">
            Choose existing session or create a new one
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div>
              Activity:{' '}
              {currentSession.activity
                ? currentSession.activity.name
                : 'Without activity'}
            </div>
            <div>
              Session {Math.round(currentSession.totalTimeSeconds / 60)} minutes
            </div>
            <div>
              Left:{' '}
              {getRemainingTimeMinutesSeconds(
                currentSession.totalTimeSeconds,
                currentSession.spentTimeSeconds
              )}
            </div>
            <div className="flex gap-4">
              <button onClick={toggleTimer}>
                {enabled ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 7.5V18M15 7.5V18M3 16.811V8.69c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811Z"
                    />
                  </svg>
                )}
              </button>
              <button onClick={stopTimer}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TimerPage;
