import { FC, useEffect, useState } from 'react';
import { IActivity } from '../ts/interfaces/Activity/IActivity';
import { useParams } from 'react-router-dom';
import { useTimer } from '../context/TimerContext';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import {
  deleteSession,
  removeCurrentSession,
  setCurrentSession,
  updateSession,
} from '../redux/slices/sessionSlice';
import axios from '../axios';
import {
  mapActivityFromResponse,
  mapSessionFromResponse,
} from '../utils/mappingHelpers';

import { ISession } from '../ts/interfaces/Session/ISession';

import SessionItem from '../components/SessionItem';

const ActivityPage: FC = () => {
  const [currentActivity, setCurrentActivity] = useState<IActivity>();
  const [uncompletedSessions, setUncompletedSessions] = useState<ISession[]>(
    []
  );
  const { activityId } = useParams();
  const { startTimer, stopTimer } = useTimer();
  const currentSession = useSelector(
    (state: RootState) => state.sessions.currentSession
  );
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const fetchActivityInfo = async () => {
      try {
        const { data: currentActivityInfo } = await axios.get(
          `/activities/${activityId}`
        );
        setCurrentActivity(mapActivityFromResponse(currentActivityInfo));

        const { data: unmappedSessions } = await axios.get(`/sessions`, {
          params: {
            activityId,
            completed: false,
          },
        });
        const mappedSessions: ISession[] = unmappedSessions.map(
          (unmappedSession: any) => mapSessionFromResponse(unmappedSession)
        );
        setUncompletedSessions(mappedSessions);
      } catch (e) {
        console.log(e);
      }
    };

    fetchActivityInfo();
  }, []);

  return (
    <>
      <div className="container">
        <div className="text-xl font-bold">{currentActivity?.name}</div>
        <div className="mt-5">{currentActivity?.descr}</div>

        {uncompletedSessions.length !== 0 && (
          <>
            <div className="mt-5 text-xl font-bold">Uncompleted sessions</div>

            <div className="flex flex-col gap-5 mt-5 w-96">
              {uncompletedSessions.map((session: ISession) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  sessionClickHandler={(sessionId: string) => {
                    if (currentSession) {
                      dispatch(updateSession(currentSession));
                    }

                    dispatch(setCurrentSession(sessionId));
                    startTimer();
                  }}
                  sessionDeleteHandler={(sessionId: string) => {
                    if (currentSession?.id === sessionId) {
                      dispatch(removeCurrentSession());
                      stopTimer();
                    }
                    dispatch(deleteSession(sessionId));

                    const uncompletedSessionsUpdated =
                      uncompletedSessions.filter(
                        (uncompletedSession) =>
                          uncompletedSession.id !== sessionId
                      );
                    setUncompletedSessions(uncompletedSessionsUpdated);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ActivityPage;
