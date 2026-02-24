import { FC, useEffect, useState } from 'react';
import { fetchSessions } from '../api/sessionApi';
import {
  getSessionFromLS,
  getActivityFromLS,
  getSelectedSecondsFromLS,
} from '../helpers/localstorageHelpers';
import { useTimer } from '../hooks/useTimer';
import { useTranslation } from 'react-i18next';

import TimerIcon from '../icons/TimerIcon';
import SessionsList from '../components/SessionsList';

import TimerLeftPart from '../components/timer/TimerLeftPart';
import TimerRightPart from '../components/timer/TimerRightPart';

import { ISession } from '../ts/interfaces/Session/ISession';

const TimerPage: FC = () => {
  const { t } = useTranslation();

  const sessionFromLS = getSessionFromLS('session');
  const unsyncedSessionFromLS = getSessionFromLS('unsyncedSession');

  const [uncompletedSessions, setUncompletedSessions] = useState<ISession[]>(
    [],
  );
  const [isSessionsBlockOpen, setIsSessionsBlockOpen] =
    useState<boolean>(false);

  const [selectedSeconds, setSelectedSeconds] = useState<number>(() =>
    getSelectedSecondsFromLS(),
  );
  const [selectedActivityId, setSelectedActivityId] = useState<string>(() =>
    getActivityFromLS(),
  );

  const { timerState } = useTimer();
  const isTimerStarted = timerState.status != 'idle';

  useEffect(() => {
    const fetchAllUncompletedSessions = async () => {
      let sessions = await fetchSessions({ completed: false });

      if (unsyncedSessionFromLS) {
        if (
          unsyncedSessionFromLS.spentTimeSeconds ==
          unsyncedSessionFromLS.totalTimeSeconds
        ) {
          sessions = sessions.filter(
            (session) => session.id != unsyncedSessionFromLS.id,
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

  return (
    <div className="h-full bg-surfaceLight dark:bg-backgroundDark">
      <div className="container flex items-stretch justify-between w-full h-full gap-10 py-5">
        {sessionFromLS && !isTimerStarted ? null : (
          <div className="sticky top-0 flex flex-col w-full text-lg gap-14 md:flex-row lg:w-auto xl:gap-28">
            <TimerLeftPart
              selectedSeconds={selectedSeconds}
              selectedActivityId={selectedActivityId}
            />

            <TimerRightPart
              selectedSeconds={selectedSeconds}
              selectedActivityId={selectedActivityId}
              setSelectedSeconds={setSelectedSeconds}
              setSelectedActivityId={setSelectedActivityId}
            />
          </div>
        )}

        {/* Uncompleted sessions block */}
        <button
          className="fixed z-[30] p-4 transition-colors duration-300 rounded-full shadow-lg xl:hidden bottom-6 right-6 bg-primary hover:bg-primaryHover"
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

            <div className="p-4 fixed xl:hidden top-0 right-0 h-full w-full min-[400px]:w-[400px] bg-[#fafafa] dark:bg-[#111] z-[61] shadow-lg transform animate-slide-in">
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
