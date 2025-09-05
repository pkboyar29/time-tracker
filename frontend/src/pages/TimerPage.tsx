import { FC, useEffect, useState } from 'react';
import {
  fetchSessions,
  updateSession,
  resetCompletedSessionId,
  resetCurrentSession,
  createSession,
} from '../redux/slices/sessionSlice';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { useQuery } from '@tanstack/react-query';
import { fetchActivities } from '../api/activityApi';
import {
  removeSessionFromLocalStorage,
  getSessionIdFromLocalStorage,
} from '../helpers/localstorageHelpers';
import {
  getRemainingTimeHoursMinutesSeconds,
  getTimeHoursMinutes,
} from '../helpers/timeHelpers';
import { getSessionsListAfterSessionUpdate } from '../helpers/sessionHelpers';
import { useTimer } from '../hooks/useTimer';
import { useStartSession } from '../hooks/useStartSession';
import { toast } from 'react-toastify';

import PrimaryClipLoader from '../components/PrimaryClipLoader';
import PlayIcon from '../icons/PlayIcon';
import PauseIcon from '../icons/PauseIcon';
import StopIcon from '../icons/StopIcon';
import CustomCircularProgress from '../components/CustomCircularProgress';
import SessionsList from '../components/SessionsList';
import Button from '../components/Button';
import RangeSlider from '../components/RangeSlider';
import NotesSection from '../components/NotesSection';
import ActivitySelect from '../components/ActivitySelect';

import { ISession } from '../ts/interfaces/Session/ISession';

const TimerPage: FC = () => {
  const sessionIdFromLocalStorage = getSessionIdFromLocalStorage();

  const [uncompletedSessions, setUncompletedSessions] = useState<ISession[]>(
    []
  );

  const { data: activitiesToChoose, isLoading: isLoadingActivities } = useQuery(
    {
      queryKey: ['activitiesToChoose'],
      queryFn: () => fetchActivities(),
      retry: false,
    }
  );

  const [selectedSeconds, setSelectedSeconds] = useState<number>(1500);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');

  const { toggleTimer, stopTimer, enabled } = useTimer();
  const { startSession } = useStartSession();

  const currentSession = useAppSelector(
    (state) => state.sessions.currentSession
  );
  // TODO: вспомнить, зачем нужно это состояние (исключительно для заполнения массива uncompletedSessions? подумать как можно обойтись без него)
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

  useEffect(() => {
    if (completedSessionId) {
      setUncompletedSessions((prevSessions) =>
        prevSessions.filter((s) => s.id !== completedSessionId)
      );

      dispatch(resetCompletedSessionId());
    }
  }, [completedSessionId]);

  const onStartSessionClick = async () => {
    try {
      const newSession = await dispatch(
        createSession({
          totalTimeSeconds: selectedSeconds,
          spentTimeSeconds: 0,
          activity: selectedActivityId !== '' ? selectedActivityId : undefined,
        })
      ).unwrap();
      startSession(newSession);

      setUncompletedSessions([...uncompletedSessions, newSession]);
    } catch (e) {
      toast('A server error occurred while starting new session', {
        type: 'error',
      });
    }
  };

  const onActivitiesSelectChange = (id: string) => {
    setSelectedActivityId(id);
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
      // TODO: если сессию не удалось обновить?
      dispatch(updateSession(currentSession));
    }

    dispatch(resetCurrentSession());
    removeSessionFromLocalStorage();
  };

  return (
    <div className="h-full bg-surfaceLight dark:bg-backgroundDark">
      <div className="container flex items-stretch justify-between h-full gap-10 py-5">
        {sessionIdFromLocalStorage && !currentSession ? null : (
          <div className="sticky top-0 flex text-lg gap-28">
            {/* Left part of timer */}
            <div className="flex flex-col items-center flex-1 gap-2">
              {currentSession ? (
                <CustomCircularProgress
                  valuePercent={
                    (currentSession.spentTimeSeconds /
                      currentSession.totalTimeSeconds) *
                    100
                  }
                  label={`${getRemainingTimeHoursMinutesSeconds(
                    currentSession.totalTimeSeconds,
                    currentSession.spentTimeSeconds
                  )}`}
                  size="verybig"
                />
              ) : (
                <CustomCircularProgress
                  valuePercent={0}
                  label={`${getRemainingTimeHoursMinutesSeconds(
                    selectedSeconds,
                    0
                  )}`}
                  size="verybig"
                />
              )}

              {currentSession ? (
                <>
                  <div className="flex mt-2 gap-7">
                    <button
                      className="bg-surfaceLightHover hover:bg-[#B5B5B5] dark:bg-surfaceDark dark:hover:bg-surfaceDarkHover transition duration-300 rounded-full p-1.5 flex"
                      onClick={handleToggleButtonClick}
                    >
                      {enabled ? <PauseIcon /> : <PlayIcon />}
                    </button>

                    <button
                      className="bg-surfaceLightHover hover:bg-[#B5B5B5] dark:bg-surfaceDark dark:hover:bg-surfaceDarkHover transition duration-300 rounded-full p-1.5"
                      onClick={handleStopButtonClick}
                    >
                      <StopIcon />
                    </button>
                  </div>

                  {!enabled && <div className="dark:text-textDark">Paused</div>}
                </>
              ) : (
                <div className="mt-2">
                  <Button onClick={onStartSessionClick} className="py-2">
                    Start new session
                  </Button>
                </div>
              )}
            </div>

            {/* Right part of timer */}
            <div className="flex flex-col p-6 rounded-lg shadow-md w-96 bg-surfaceLightHover dark:bg-surfaceDark">
              <div className="flex flex-col flex-grow gap-5 overflow-auto">
                {currentSession && (
                  <div className="text-lg font-semibold dark:text-textDark">
                    Session{' '}
                    {getTimeHoursMinutes(
                      currentSession.totalTimeSeconds,
                      false
                    )}
                  </div>
                )}

                <div>
                  <span className="block mb-2 text-lg font-semibold dark:text-textDark">
                    Activity
                  </span>
                  {!currentSession ? (
                    <div className="h-[42px] flex items-center">
                      {isLoadingActivities ? (
                        <PrimaryClipLoader size="25px" />
                      ) : (
                        activitiesToChoose && (
                          <ActivitySelect
                            topActivities={activitiesToChoose.topActivities}
                            remainingActivities={
                              activitiesToChoose.remainingActivities
                            }
                            value={selectedActivityId}
                            onChange={onActivitiesSelectChange}
                          />
                        )
                      )}
                    </div>
                  ) : currentSession.activity ? (
                    <div className="text-base dark:text-textDark">
                      {currentSession.activity.name}
                    </div>
                  ) : (
                    <div className="text-base italic text-gray-500 dark:text-textDarkSecondary">
                      Without activity
                    </div>
                  )}
                </div>

                {!currentSession && (
                  <div>
                    <span className="block mb-2 text-lg font-semibold dark:text-textDark">
                      Session duration (minutes)
                    </span>
                    <RangeSlider
                      minValue={1}
                      maxValue={600}
                      currentValue={selectedSeconds / 60}
                      changeCurrentValue={(newCurrentValue) =>
                        setSelectedSeconds(newCurrentValue * 60)
                      }
                    />
                  </div>
                )}

                {currentSession && (
                  <div className="flex flex-col flex-grow">
                    <div className="mb-2 text-xl font-bold dark:text-textDark">
                      Notes
                    </div>
                    <NotesSection />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="ml-auto overflow-auto">
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
  );
};

export default TimerPage;
