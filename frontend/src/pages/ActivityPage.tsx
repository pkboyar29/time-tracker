import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { IActivity } from '../ts/interfaces/Activity/IActivity';
import { useParams } from 'react-router-dom';
import { useTimer } from '../context/TimerContext';
import { useForm } from 'react-hook-form';
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
import { updateActivity } from '../redux/slices/activitySlice';

interface ActivityFields {
  name: string;
  descr?: string;
}

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

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isValid, errors },
  } = useForm<ActivityFields>({
    mode: 'onBlur',
  });

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

  useEffect(() => {
    if (currentActivity) {
      setValue('name', currentActivity.name);
      setValue('descr', currentActivity.descr);
    }
  }, [currentActivity]);

  const handleFocus = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const end = e.target.value.length;
    setTimeout(() => {
      e.target.setSelectionRange(end, end);
    }, 0);
  };

  const onSubmit = (data: ActivityFields) => {
    console.log('отправка данных на сервер');
    if (currentActivity) {
      dispatch(
        updateActivity({
          id: currentActivity.id,
          ...data,
        })
      );
    }
  };

  useEffect(() => {
    console.log(errors.name);
  }, [errors.name]);

  return (
    <>
      <div className="container">
        <div className="inline-flex flex-col gap-2">
          <input
            {...register('name', {
              required: true,
              maxLength: 50,
              minLength: 1,
            })}
            onFocus={handleFocus}
            onBlur={handleSubmit(onSubmit)}
            type="text"
            className={
              'p-1 text-xl font-bold rounded-lg focus:border focus:border-solid focus:border-blue-700 ' +
              (errors.name ? 'focus:border-red-500' : 'asdasd')
            }
          />

          <textarea
            placeholder="Enter desciption"
            {...register('descr', {
              maxLength: 500,
            })}
            onFocus={handleFocus}
            onBlur={handleSubmit(onSubmit)}
            className={
              'p-1 text-base font-medium rounded-lg h-28 focus:border focus:border-solid focus:border-blue-700 ' +
              (errors.descr ? 'focus:border-red-500' : '')
            }
          />
        </div>

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
