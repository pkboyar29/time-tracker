import { FC, useEffect, useState, useRef } from 'react';
import { fetchSessions, createSession } from '../api/sessionApi';
import { useQueryCustom } from '../hooks/useQueryCustom';
import { fetchActivities } from '../api/activityApi';
import { getSessionFromLocalStorage } from '../helpers/localstorageHelpers';
import {
  getRemainingTimeHoursMinutesSeconds,
  getReadableTime,
  getTimeHHmmFromDate,
} from '../helpers/timeHelpers';
import { useTimer } from '../hooks/useTimer';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import PrimaryClipLoader from '../components/common/PrimaryClipLoader';
import PlayIcon from '../icons/PlayIcon';
import PauseIcon from '../icons/PauseIcon';
import StopIcon from '../icons/StopIcon';
import TimerIcon from '../icons/TimerIcon';
import CustomCircularProgress from '../components/common/CustomCircularProgress';
import SessionsList from '../components/SessionsList';
import Button from '../components/common/Button';
import RangeSlider from '../components/common/RangeSlider';
import SessionDurationInputs from '../components/SessionDurationInputs';
import NotesSection from '../components/NotesSection';
import CustomSelect from '../components/common/CustomSelect';

import { ISession } from '../ts/interfaces/Session/ISession';

const TimerPage: FC = () => {
  const { t } = useTranslation();

  const sessionFromLS = getSessionFromLocalStorage('session');
  const unsyncedSessionFromLS = getSessionFromLocalStorage('unsyncedSession');

  const [uncompletedSessions, setUncompletedSessions] = useState<ISession[]>(
    []
  );
  const [isSessionsBlockOpen, setIsSessionsBlockOpen] =
    useState<boolean>(false);

  const { data: activitiesToChoose, isLoading: isLoadingActivities } =
    useQueryCustom({
      queryKey: ['activitiesToChoose'],
      queryFn: () => fetchActivities(),
    });

  const [selectedSeconds, setSelectedSeconds] = useState<number>(1500);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');

  const {
    startTimer,
    toggleTimer,
    stopTimer,
    timerState,
    timerEndDate,
    startTimestamp,
    startSpentSeconds,
  } = useTimer();
  const isTimerStarted = timerState.status != 'idle';
  const [spentMs, setSpentMs] = useState<number>(0);
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);

  // TODO bug: переключаясь между сессиями, может происходить туда сюда метание прогресса
  useEffect(() => {
    intervalId.current && clearInterval(intervalId.current);

    if (timerState.status == 'running') {
      intervalId.current = setInterval(() => {
        const newSpentMs =
          startSpentSeconds * 1000 + (Date.now() - startTimestamp);
        setSpentMs(newSpentMs);
      }, 100);
    } else if (timerState.status == 'paused') {
      setSpentMs(timerState.session.spentTimeSeconds * 1000); // set milliseconds rounded to full seconds
    } else {
      setSpentMs(0);
    }
    return () => {
      intervalId.current && clearInterval(intervalId.current);
    };
  }, [timerState.status, timerState.session?.id]);

  useEffect(() => {
    const handleKeyClick = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.code == 'Space') {
        if (isTimerStarted) {
          handleToggleButtonClick();
        } else {
          handleStartSessionClick();
        }
      } else if (event.code == 'Escape') {
        handleStopButtonClick();
      }
    };

    window.addEventListener('keyup', handleKeyClick);
    return () => {
      window.removeEventListener('keyup', handleKeyClick);
    };
  }, [timerState, selectedSeconds, selectedActivityId]);

  useEffect(() => {
    const fetchAllUncompletedSessions = async () => {
      let sessions = await fetchSessions({ completed: false });

      if (unsyncedSessionFromLS) {
        if (
          unsyncedSessionFromLS.spentTimeSeconds ==
          unsyncedSessionFromLS.totalTimeSeconds
        ) {
          sessions = sessions.filter(
            (session) => session.id != unsyncedSessionFromLS.id
          );
        } else {
          sessions = sessions.map((session) => {
            if (session.id == unsyncedSessionFromLS.id) {
              return unsyncedSessionFromLS;
            } else {
              return session;
            }
          });
        }
      }

      setUncompletedSessions(sessions);
    };

    fetchAllUncompletedSessions();
  }, []);

  const handleStartSessionClick = async () => {
    try {
      const newSession = await createSession({
        totalTimeSeconds: selectedSeconds,
        spentTimeSeconds: 0,
        activity: selectedActivityId !== '' ? selectedActivityId : undefined,
      });

      startTimer(newSession);
    } catch (e) {
      toast(t('serverErrors.startSession'), {
        type: 'error',
      });
    }
  };

  const onActivitiesSelectChange = (id: string) => {
    setSelectedActivityId(id);
  };

  const handleToggleButtonClick = () => {
    toggleTimer();
  };

  const handleStopButtonClick = () => {
    stopTimer(true);
  };

  return (
    <div className="h-full bg-surfaceLight dark:bg-backgroundDark">
      <div className="container flex items-stretch justify-between w-full h-full gap-10 py-5">
        {sessionFromLS && !isTimerStarted ? null : (
          <div className="sticky top-0 flex flex-col w-full gap-8 text-lg sm:flex-row md:gap-16 lg:w-auto xl:gap-28">
            {/* Left part of timer */}
            <div className="flex flex-col items-center gap-2 sm:flex-1 basis-1/3 sm:basis-auto">
              {!isTimerStarted ? (
                <CustomCircularProgress
                  valuePercent={0}
                  label={`${getRemainingTimeHoursMinutesSeconds(
                    selectedSeconds,
                    0
                  )}`}
                  size="verybig"
                />
              ) : (
                <CustomCircularProgress
                  valuePercent={
                    (spentMs / (timerState.session.totalTimeSeconds * 1000)) *
                    100
                  }
                  label={`${getRemainingTimeHoursMinutesSeconds(
                    timerState.session.totalTimeSeconds,
                    timerState.session.spentTimeSeconds
                  )}`}
                  size="verybig"
                />
              )}

              {!isTimerStarted ? (
                <div className="mt-2">
                  <Button
                    tabIndex={-1}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      handleStartSessionClick();
                    }}
                    className="py-[6.5px]"
                  >
                    {t('timerPage.startSessionButton')}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex mt-2 gap-7">
                    <button
                      tabIndex={-1}
                      className="bg-surfaceLightHover hover:bg-[#B5B5B5] dark:bg-surfaceDark dark:hover:bg-surfaceDarkHover transition duration-300 rounded-full p-1.5 flex"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        handleToggleButtonClick();
                      }}
                    >
                      {timerState.status == 'running' ? (
                        <PauseIcon />
                      ) : (
                        <PlayIcon />
                      )}
                    </button>

                    <button
                      tabIndex={-1}
                      className="bg-surfaceLightHover hover:bg-[#B5B5B5] dark:bg-surfaceDark dark:hover:bg-surfaceDarkHover transition duration-300 rounded-full p-1.5"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        handleStopButtonClick();
                      }}
                    >
                      <StopIcon />
                    </button>
                  </div>

                  <div className="h-6 dark:text-textDark">
                    {timerState.status == 'paused' && t('timerPage.paused')}
                  </div>
                </>
              )}
            </div>

            {/* Right part of timer */}
            <div className="min-h-[450px] flex flex-col flex-1 w-full p-6 overflow-y-hidden rounded-lg shadow-md lg:flex-none lg:w-96 bg-surfaceLightHover dark:bg-surfaceDark basis-1/3 sm:basis-auto">
              <div className="flex flex-col flex-grow gap-5">
                {isTimerStarted && (
                  <>
                    <div className="text-lg font-semibold dark:text-textDark">
                      {t('timerPage.session')}{' '}
                      {getReadableTime(timerState.session.totalTimeSeconds, t, {
                        short: false,
                      })}
                    </div>

                    <div className="flex items-center dark:text-textDark">
                      <span>{t('timerPage.endsAt')}</span>
                      <span className="inline-block min-w-[3.5rem] text-center font-bold">
                        {timerState.status === 'paused'
                          ? '...'
                          : getTimeHHmmFromDate(timerEndDate)}
                      </span>
                    </div>
                  </>
                )}

                <div className="dark:text-textDark">
                  <span className="block mb-0 text-lg font-semibold sm:mb-2 dark:text-textDark">
                    {t('timerPage.activity')}
                    {isTimerStarted && (
                      <span className="text-base dark:text-textDark sm:hidden">
                        :{' '}
                        {timerState.session?.activity
                          ? timerState.session?.activity.name
                          : t('withoutActivity')}
                      </span>
                    )}
                  </span>
                  {!isTimerStarted ? (
                    <div className="h-[42px] flex items-center">
                      {isLoadingActivities ? (
                        <PrimaryClipLoader size="25px" />
                      ) : (
                        activitiesToChoose && (
                          <CustomSelect
                            currentId={selectedActivityId}
                            onChange={onActivitiesSelectChange}
                            optionGroups={[
                              {
                                optGroupName: '',
                                color: 'grey',
                                options: [
                                  { id: '', name: t('withoutActivity') },
                                ],
                              },
                              {
                                optGroupName: `${t(
                                  'timerPage.lastActivities'
                                )} ⭐`,
                                color: 'red',
                                options: activitiesToChoose.topActivities,
                              },
                              {
                                optGroupName: t('timerPage.allActivities'),
                                color: 'standart',
                                options: [
                                  ...activitiesToChoose.remainingActivities,
                                ],
                              },
                            ]}
                          />
                        )
                      )}
                    </div>
                  ) : timerState.session.activity ? (
                    <div className="hidden text-base sm:block dark:text-textDark">
                      {timerState.session.activity.name}
                    </div>
                  ) : (
                    <div className="hidden text-base italic text-gray-500 sm:block dark:text-textDarkSecondary">
                      {t('withoutActivity')}
                    </div>
                  )}
                </div>

                {!isTimerStarted && (
                  <div>
                    <span className="block mb-2 text-lg font-semibold dark:text-textDark">
                      {t('timerPage.sessionDuration')}
                    </span>
                    <div className="hidden md:block">
                      <RangeSlider
                        minValue={1}
                        maxValue={600}
                        currentValue={selectedSeconds / 60}
                        changeCurrentValue={(newCurrentValue) =>
                          setSelectedSeconds(newCurrentValue * 60)
                        }
                      />
                    </div>
                    <div className="block md:hidden">
                      <SessionDurationInputs
                        seconds={selectedSeconds}
                        setSeconds={setSelectedSeconds}
                      />
                    </div>
                  </div>
                )}

                {isTimerStarted && (
                  <div className="flex flex-col flex-grow">
                    <div className="mb-2 text-xl font-bold dark:text-textDark">
                      {t('timerPage.notes')}
                    </div>
                    <NotesSection defaultNote={timerState.session.note} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Uncompleted sessions block */}
        <button
          className="fixed z-50 p-4 transition-colors duration-300 rounded-full shadow-lg xl:hidden bottom-6 right-6 bg-primary hover:bg-primaryHover"
          onClick={() => setIsSessionsBlockOpen(true)}
        >
          <TimerIcon className="stroke-textDark" />
        </button>
        {isSessionsBlockOpen && (
          <>
            <div
              className="fixed xl:hidden inset-0 z-[60] bg-black/50 backdrop-blur-sm backdrop-blur-fade-in"
              onClick={() => setIsSessionsBlockOpen(false)}
            />

            <div className="p-4 fixed xl:hidden top-0 right-0 h-full w-full min-[400px]:w-[400px] bg-[#fafafa] dark:bg-[#111] z-[70] shadow-lg transform animate-slide-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold dark:text-textDark">
                  {t('timerPage.uncompletedSessions')}
                </h2>
                <button
                  onClick={() => setIsSessionsBlockOpen(false)}
                  className="dark:text-gray-400"
                >
                  ✕
                </button>
              </div>

              <div className="w-full overflow-y-auto h-[calc(100%-3rem)]">
                <SessionsList
                  title=""
                  isExpandable={false}
                  setIsSessionsBlockOpen={setIsSessionsBlockOpen}
                  sessions={uncompletedSessions}
                  updateSessionsListHandler={setUncompletedSessions}
                />
              </div>
            </div>
          </>
        )}

        <SessionsList
          classname="hidden xl:flex"
          title={t('timerPage.uncompletedSessions')}
          isExpandable={true}
          sessions={uncompletedSessions}
          updateSessionsListHandler={setUncompletedSessions}
        />
      </div>
    </div>
  );
};

export default TimerPage;
