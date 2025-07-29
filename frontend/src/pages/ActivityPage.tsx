import { FC, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSessions } from '../redux/slices/sessionSlice';
import { useAppDispatch } from '../redux/store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchActivity } from '../api/activityApi';
import { toast } from 'react-toastify';

import { ISession } from '../ts/interfaces/Session/ISession';

import ActivityCommonUpdateForm from '../components/forms/ActivityCommonUpdateForm';
import SessionsList from '../components/SessionsList';
import { ClipLoader } from 'react-spinners';

const ActivityPage: FC = () => {
  const { activityId } = useParams();

  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    data: currentActivity,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['activity', activityId],
    queryFn: () => fetchActivity(activityId!),
    retry: false,
  });

  const [uncompletedSessionsForActivity, setUncompletedSessionsForActivity] =
    useState<ISession[]>([]);
  // TODO: что тут происходит
  useEffect(() => {
    const fetchUncompletedSessionsForActivity = async () => {
      try {
        const actionResult = await dispatch(
          fetchSessions({
            activityId: activityId,
            completed: false,
          })
        );
        if (fetchSessions.fulfilled.match(actionResult)) {
          setUncompletedSessionsForActivity(actionResult.payload);
        }
      } catch (e) {
        console.log(e);
      }
    };

    if (currentActivity) {
      fetchUncompletedSessionsForActivity();
    }
  }, [currentActivity]);

  useEffect(() => {
    if (isError) {
      toast('A server error occurred while getting activity', {
        type: 'error',
      });
    }
  }, [isError]);

  const updateSessionsList = (updatedList: ISession[]) => {
    setUncompletedSessionsForActivity(updatedList);
  };

  return (
    <>
      {isLoading ? (
        <div className="mt-5 text-center">
          <ClipLoader color="#EF4444" />
        </div>
      ) : (
        <div className="container">
          <div className="mt-5">
            <span
              onClick={() => navigate('/activity-groups')}
              className="transition duration-300 cursor-pointer hover:text-red-500"
            >
              Activity groups
            </span>{' '}
            /{' '}
            <span
              onClick={() =>
                navigate(
                  `/activity-groups/${currentActivity?.activityGroup.id}`
                )
              }
              className="transition duration-300 cursor-pointer hover:text-red-500"
            >
              {currentActivity?.activityGroup.name}
            </span>
            <span> / {currentActivity?.name}</span>
          </div>

          <div className="mt-5">
            {currentActivity && (
              <ActivityCommonUpdateForm
                activityCommon={currentActivity}
                afterUpdateHandler={(updatedActivity) => {
                  if ('activityGroup' in updatedActivity) {
                    queryClient.setQueryData(
                      ['activity', activityId],
                      () => updatedActivity
                    );
                  }
                }}
              />
            )}
          </div>

          {uncompletedSessionsForActivity.length > 0 && (
            <>
              <SessionsList
                title="Uncompleted sessions"
                sessions={uncompletedSessionsForActivity}
                updateSessionsListHandler={updateSessionsList}
              />
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ActivityPage;
