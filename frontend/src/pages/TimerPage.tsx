import { FC, useEffect, useState } from 'react';
import {
  fetchSessions,
  updateSession,
  deleteSession,
  setCurrentSession,
  updateCurrentSessionNote,
  removeCurrentSession,
} from '../redux/slices/sessionSlice';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { getRemainingTimeHoursMinutesSeconds } from '../utils/timerHelpers';
import { useTimer } from '../context/TimerContext';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import CustomCircularProgress from '../components/CustomCircularProgress';
import SessionItem from '../components/SessionItem';
import SessionCreateForm from '../components/forms/SessionCreateForm';
import Button from '../components/Button';
import Modal from '../components/Modal';

interface DeleteModalState {
  deleteModal: boolean;
  deletedSessionId: string | null;
}

const TimerPage: FC = () => {
  const [createModal, setCreateModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>();
  const [uncompletedLess, setUnompletedLess] = useState<boolean>(false); // less - true, more - false

  const { startTimer, toggleTimer, stopTimer, enabled } = useTimer();

  const [note, setNote] = useState<string>('');
  const [isFocusedNote, setFocusedNote] = useState<boolean>(false);

  const uncompletedSessions = useSelector(
    (state: RootState) => state.sessions.uncompletedSessions
  );
  const currentSession = useSelector(
    (state: RootState) => state.sessions.currentSession
  );
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchSessions());
  }, []);

  useEffect(() => {
    if (currentSession) {
      if (!isFocusedNote) {
        if (currentSession.note) {
          setNote(currentSession.note);
        } else {
          setNote('');
        }
      }
    }
  }, [currentSession]);

  const onSessionClick = (sessionId: string) => {
    if (currentSession) {
      dispatch(updateSession(currentSession));

      if (currentSession.id === sessionId) {
        toggleTimer();
      } else {
        dispatch(setCurrentSession(sessionId));
        startTimer();
      }
    } else {
      dispatch(setCurrentSession(sessionId));
      startTimer();
    }
  };

  const onDeleteSessionClick = (sessionId: string) => {
    if (currentSession?.id === sessionId) {
      dispatch(removeCurrentSession());
      stopTimer();
    }
    setDeleteModal({
      deleteModal: false,
      deletedSessionId: null,
    });
    dispatch(deleteSession(sessionId));
  };

  const onChangeNoteInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(event.target.value);
  };

  const onFocusNoteInput = () => {
    setFocusedNote(true);
  };

  const onBlurNoteInput = () => {
    setFocusedNote(false);

    if (currentSession) {
      if (currentSession.note !== note) {
        dispatch(updateCurrentSessionNote(note));

        dispatch(
          updateSession({
            ...currentSession,
            note,
          })
        );
      }
    }
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
              if (currentSession) {
                dispatch(updateSession(currentSession));
              }

              startTimer();
              setCreateModal(false);
            }}
          />
        </Modal>
      )}

      {deleteModal?.deleteModal && (
        <Modal
          title="Deleting session"
          onCloseModal={() =>
            setDeleteModal({
              deleteModal: false,
              deletedSessionId: null,
            })
          }
        >
          <Button
            onClick={() =>
              deleteModal.deletedSessionId &&
              onDeleteSessionClick(deleteModal.deletedSessionId)
            }
          >
            Delete session
          </Button>
        </Modal>
      )}

      <div className="container flex justify-between">
        <div>
          {!currentSession ? (
            <div className="text-2xl font-semibold">
              Choose existing session or create a new one
            </div>
          ) : (
            <div className="flex text-lg gap-28">
              <div className="flex flex-col items-center gap-2">
                <div>
                  Session {Math.round(currentSession.totalTimeSeconds / 60)}{' '}
                  minutes
                </div>

                <CustomCircularProgress
                  value={
                    (currentSession.spentTimeSeconds /
                      currentSession.totalTimeSeconds) *
                    100
                  }
                  label={`Left ${getRemainingTimeHoursMinutesSeconds(
                    currentSession.totalTimeSeconds,
                    currentSession.spentTimeSeconds
                  )}`}
                  size="big"
                />

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
                {!enabled && <div>Paused</div>}
              </div>
              <div className="flex flex-col gap-4">
                {currentSession.activity ? (
                  <>
                    <div>
                      <span className="font-semibold">Activity group: </span>{' '}
                      {currentSession.activity.activityGroupName}
                    </div>
                    <div>
                      <span className="font-semibold">Activity: </span>
                      {currentSession.activity.name}
                    </div>
                  </>
                ) : (
                  <>Without activity</>
                )}

                <div className="text-xl font-bold">Notes</div>
                <textarea
                  placeholder="Enter your thoughts during this session..."
                  value={note}
                  onChange={onChangeNoteInput}
                  onFocus={onFocusNoteInput}
                  onBlur={onBlurNoteInput}
                  className={
                    'p-1 text-base font-medium rounded-lg h-28 border border-solid border-gray-300 focus:border-blue-700 '
                  }
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end">
          <Button onClick={() => setCreateModal(true)}>
            Create new session
          </Button>
          <button
            onClick={() => setUnompletedLess(!uncompletedLess)}
            className="flex items-center gap-1 my-5 text-xl font-bold"
          >
            Uncompleted sessions{' '}
            {uncompletedLess ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </button>
          {!uncompletedLess && (
            <div className="inline-flex flex-col gap-2">
              {uncompletedSessions.map((session) => (
                <SessionItem
                  isActive={session.id === currentSession?.id}
                  isEnabled={
                    session.id === currentSession?.id ? enabled : undefined
                  }
                  key={session.id}
                  session={session}
                  sessionClickHandler={onSessionClick}
                  sessionDeleteHandler={(sessionId: string) =>
                    setDeleteModal({
                      deleteModal: true,
                      deletedSessionId: sessionId,
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TimerPage;
