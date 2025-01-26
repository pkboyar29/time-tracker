import { FC, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../axios';
import { mapActivityFromResponse } from '../helpers/mappingHelpers';
import { fetchSessions } from '../redux/slices/sessionSlice';
import { useAppDispatch } from '../redux/store';

import { IActivity } from '../ts/interfaces/Activity/IActivity';
import { ISession } from '../ts/interfaces/Session/ISession';

import ActivityCommonUpdateForm from '../components/forms/ActivityCommonUpdateForm';
import SessionsList from '../components/SessionsList';

const ActivityPage: FC = () => {
  const [currentActivity, setCurrentActivity] = useState<IActivity>();
  const { activityId } = useParams();
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const [uncompletedSessionsForActivity, setUncompletedSessionsForActivity] =
    useState<ISession[]>([]);

  useEffect(() => {
    const fetchActivityInfo = async () => {
      try {
        const { data: currentActivityInfo } = await axiosInstance.get(
          `/activities/${activityId}`
        );
        setCurrentActivity(mapActivityFromResponse(currentActivityInfo));

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

    fetchActivityInfo();
  }, []);

  const updateSessionsList = (updatedList: ISession[]) => {
    setUncompletedSessionsForActivity(updatedList);
  };

  return (
    <>
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
              navigate(`/activity-groups/${currentActivity?.activityGroup.id}`)
            }
            className="transition duration-300 cursor-pointer hover:text-red-500"
          >
            {currentActivity?.activityGroup.name}
          </span>
          <span> / {currentActivity?.name}</span>
        </div>

        <div className="mt-5"></div>
        {currentActivity && (
          <ActivityCommonUpdateForm activityCommon={currentActivity} />
        )}

        <div className="mt-5 text-xl font-bold">Uncompleted sessions</div>

        <SessionsList
          sessions={uncompletedSessionsForActivity}
          updateSessionsList={updateSessionsList}
        />
      </div>
    </>
  );
};

export default ActivityPage;
