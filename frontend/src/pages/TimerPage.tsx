import { FC, useEffect, useState } from 'react';
import {
  fetchSessions,
  updateSession,
  updateCurrentSessionNote,
  resetCompletedSessionId,
  resetCurrentSession,
} from '../redux/slices/sessionSlice';
import { removeSessionFromLocalStorage } from '../helpers/localstorageHelpers';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { getRemainingTimeHoursMinutesSeconds } from '../helpers/timeHelpers';
import { getSessionsListAfterSessionUpdate } from '../helpers/sessionHelpers';
import { useTimer } from '../context/TimerContext';

import ResumeIcon from '../icons/ResumeIcon';
import PauseIcon from '../icons/PauseIcon';
import StopIcon from '../icons/StopIcon';
import CustomCircularProgress from '../components/CustomCircularProgress';
import SessionsList from '../components/SessionsList';
import Button from '../components/Button';
import SessionCreateModal from '../components/modals/SessionCreateModal';

import { ISession } from '../ts/interfaces/Session/ISession';

const TimerPage: FC = () => {
  const [createModal, setCreateModal] = useState<boolean>(false);
  const [uncompletedSessions, setUncompletedSessions] = useState<ISession[]>(
    []
  );

  const { toggleTimer, stopTimer, enabled } = useTimer();

  const [note, setNote] = useState<string>('');
  const [isFocusedNote, setFocusedNote] = useState<boolean>(false);

  const currentSession = useAppSelector(
    (state) => state.sessions.currentSession
  );
  const completedSessionId = useAppSelector(
    (state) => state.sessions.completedSessionId
  );

  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleKeyClick = (event: KeyboardEvent) => {
      if (event.code == 'Space') {
        handleToggleButtonClick();
      }
    };

    window.addEventListener('keyup', handleKeyClick);

    return () => {
      window.removeEventListener('keyup', handleKeyClick);
    };
  }, []);

  useEffect(() => {
    const fetchAllUncompletedSessions = async () => {
      const resultAction = await dispatch(fetchSessions({ completed: false }));
      if (fetchSessions.fulfilled.match(resultAction)) {
        setUncompletedSessions(resultAction.payload);
      }
    };

    fetchAllUncompletedSessions();
  }, []);

  // TODO: разобраться с этим пока непонятным на первый взгляд useEffect
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

  useEffect(() => {
    if (completedSessionId) {
      setUncompletedSessions((prevSessions) =>
        prevSessions.filter((s) => s.id !== completedSessionId)
      );

      dispatch(resetCompletedSessionId());
    }
  }, [completedSessionId]);

  const handleChangeNoteInput = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setNote(event.target.value);
  };

  const handleFocusNoteInput = () => {
    setFocusedNote(true);
  };

  const handleBlurNoteInput = () => {
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

  const handleAfterSubmitCreateSession = (session: ISession) => {
    if (currentSession) {
      dispatch(updateSession(currentSession));
    }

    setUncompletedSessions([...uncompletedSessions, session]);

    toggleTimer(0);
    setCreateModal(false);
  };

  const handleToggleButtonClick = () => {
    if (currentSession) {
      if (enabled) {
        setUncompletedSessions(
          getSessionsListAfterSessionUpdate(uncompletedSessions, currentSession)
        );
        dispatch(updateSession(currentSession));
      }

      toggleTimer(currentSession.spentTimeSeconds);
    }
  };

  const handleStopButtonClick = () => {
    stopTimer();

    if (currentSession) {
      setUncompletedSessions(
        getSessionsListAfterSessionUpdate(uncompletedSessions, currentSession)
      );
      dispatch(updateSession(currentSession));
    }

    dispatch(resetCurrentSession());
    removeSessionFromLocalStorage();
  };

  return (
    <>
      {createModal && (
        <SessionCreateModal
          modalTitle="Creating new session"
          afterSubmitHandler={handleAfterSubmitCreateSession}
          onCloseModal={() => setCreateModal(false)}
        />
      )}

      <div className="h-full bg-white">
        <div className="container flex justify-between h-full py-5">
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
                    valuePercent={
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
                    <button onClick={handleToggleButtonClick}>
                      {enabled ? <PauseIcon /> : <ResumeIcon />}
                    </button>

                    <button onClick={handleStopButtonClick}>
                      <StopIcon />
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
                    onChange={handleChangeNoteInput}
                    onFocus={handleFocusNoteInput}
                    onBlur={handleBlurNoteInput}
                    className={
                      'p-1 text-base font-medium rounded-lg h-28 border border-solid border-gray-300 focus:border-red-500 '
                    }
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end">
            <div>
              <Button onClick={() => setCreateModal(true)}>
                Create new session
              </Button>
            </div>

            {uncompletedSessions.length > 0 && (
              <SessionsList
                title="Uncompleted sessions"
                sessions={uncompletedSessions}
                updateSessionsListHandler={setUncompletedSessions}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TimerPage;
