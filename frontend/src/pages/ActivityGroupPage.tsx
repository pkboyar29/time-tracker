import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { fetchActivities, deleteActivity } from '../redux/slices/activitySlice';
import { useTimer } from '../context/TimerContext';
import { useParams } from 'react-router-dom';
import { updateSession } from '../redux/slices/sessionSlice';
import axios from '../axios';

import CloseIcon from '@mui/icons-material/Close';
import ActivityCreateForm from '../components/forms/ActivityCreateForm';
import SessionCreateForm from '../components/forms/SessionCreateForm';
import ActivityCommonUpdateForm from '../components/forms/ActivityCommonUpdateForm';
import ActivityItem from '../components/ActivityItem';
import Button from '../components/Button';
import Modal from '../components/Modal';

import { IActivityGroup } from '../ts/interfaces/ActivityGroup/IActivityGroup';
import { mapActivityGroupFromResponse } from '../utils/mappingHelpers';

const ActivityGroupPage: FC = () => {
  const activities = useSelector(
    (state: RootState) => state.activities.activities
  );
  const currentSession = useSelector(
    (state: RootState) => state.sessions.currentSession
  );
  const { activityGroupId } = useParams();
  const [currentActivityGroup, setCurrentActivityGroup] =
    useState<IActivityGroup>();

  const [createModal, setCreateModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<string | null>(null); // we store here id of activity we want to delete or null
  const [createSessionModal, setCreateSessionModal] = useState<string | null>(
    null
  ); // we store here id of activity we want to create session of or null
  const [searchString, setSearchString] = useState<string>('');
  const { startTimer } = useTimer();

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActivityGroupInfo = async () => {
      const { data: unmappedActivityGroup } = await axios.get(
        `/activity-groups/${activityGroupId}`
      );
      const mappedActivityGroup: IActivityGroup = mapActivityGroupFromResponse(
        unmappedActivityGroup
      );
      setCurrentActivityGroup(mappedActivityGroup);
    };
    fetchActivityGroupInfo();
  }, [activityGroupId]);

  useEffect(() => {
    if (activityGroupId) {
      dispatch(fetchActivities(activityGroupId));
    }
  }, [activityGroupId]);

  const onEditActivityClick = (activityId: string) => {
    navigate(`activities/${activityId}`);
  };

  const onDeleteActivityClick = (activityId: string) => {
    setDeleteModal(null);
    dispatch(deleteActivity(activityId));
  };

  return (
    <>
      {createModal && (
        <Modal
          title={
            <div>
              <span className="font-bold">{currentActivityGroup?.name}</span>:
              creating a new activity
            </div>
          }
          onCloseModal={() => {
            setCreateModal(false);
          }}
        >
          {currentActivityGroup && (
            <ActivityCreateForm
              afterSubmitHandler={() => {
                setCreateModal(false);
              }}
              activityGroupId={currentActivityGroup.id}
            />
          )}
        </Modal>
      )}

      {deleteModal && (
        <Modal
          title="Deleting activity"
          onCloseModal={() => setDeleteModal(null)}
        >
          <Button onClick={() => onDeleteActivityClick(deleteModal)}>
            Delete activity
          </Button>
        </Modal>
      )}

      {createSessionModal && (
        <Modal
          title={
            <div>
              <span className="font-bold">
                {
                  activities.find(
                    (activity) => activity.id === createSessionModal
                  )?.name
                }
              </span>
              : starting new session
            </div>
          }
          onCloseModal={() => setCreateSessionModal(null)}
        >
          <SessionCreateForm
            defaultActivity={createSessionModal}
            afterSubmitHandler={() => {
              if (currentSession) {
                dispatch(updateSession(currentSession));
              }

              startTimer();
              navigate('/timer');
            }}
          />
        </Modal>
      )}

      <div className="container flex justify-between">
        <div>
          {currentActivityGroup && (
            <ActivityCommonUpdateForm activityCommon={currentActivityGroup} />
          )}
          <div className="my-5 text-xl font-bold">All activities</div>
          <div className="flex flex-col gap-4">
            {activities.filter((activity) =>
              activity.name.includes(searchString)
            ).length !== 0 ? (
              activities
                .filter((activity) => activity.name.includes(searchString))
                .map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    editHandler={onEditActivityClick}
                    deleteHandler={setDeleteModal}
                    startSessionHandler={() =>
                      setCreateSessionModal(activity.id)
                    }
                  />
                ))
            ) : (
              <>Not found</>
            )}
          </div>
        </div>

        <div className="flex h-full gap-5">
          <div className="relative flex">
            <input
              value={searchString}
              onChange={(e) => setSearchString(e.target.value)}
              className="transition duration-300 border-b border-solid border-b-gray-500 focus:border-b-red-500"
              type="text"
              placeholder="Search..."
            />
            {searchString && (
              <button
                className="absolute right-0 z-10 top-[6px]"
                onClick={() => setSearchString('')}
              >
                <CloseIcon />
              </button>
            )}
          </div>
          <Button onClick={() => setCreateModal(true)}>
            Create new activity
          </Button>
        </div>
      </div>
    </>
  );
};

export default ActivityGroupPage;
