import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { fetchActivities, deleteActivity } from '../redux/slices/activitySlice';
import { useTimer } from '../context/TimerContext';
import CloseIcon from '@mui/icons-material/Close';

import ActivityManageForm from '../components/forms/ActivityManageForm';
import SessionCreateForm from '../components/forms/SessionCreateForm';
import ActivityItem from '../components/ActivityItem';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { IActivity } from '../ts/interfaces/Activity/IActivity';

const ActivitiesPage: FC = () => {
  const activities = useSelector(
    (state: RootState) => state.activities.activities
  );
  const [currentActivity, setCurrentActivity] = useState<IActivity | null>(
    null
  );
  const [manageModal, setManageModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<string | null>(null); // we store here id of activity we want to delete or null
  const [createSessionModal, setCreateSessionModal] = useState<string | null>(
    null
  ); // we store here id of activity we want to create session of or null
  const [searchString, setSearchString] = useState<string>('');
  const { startTimer } = useTimer();

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchActivities());
  }, []);

  const onEditActivityClick = (activity: IActivity) => {
    setCurrentActivity(activity);
    setManageModal(true);

    navigate(`${activity.id}`);
  };

  const onDeleteActivityClick = (activityId: string) => {
    setDeleteModal(null);
    dispatch(deleteActivity(activityId));
  };

  return (
    <>
      {manageModal && (
        <Modal
          title={
            !currentActivity
              ? 'Creating a new activity'
              : 'Updating an activity'
          }
          onCloseModal={() => {
            setManageModal(false);
            setCurrentActivity(null);
          }}
        >
          <ActivityManageForm
            currentActivity={currentActivity}
            afterSubmitHandler={() => {
              setCurrentActivity(null);
              setManageModal(false);
            }}
          />
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
          title="Starting new session"
          onCloseModal={() => setCreateSessionModal(null)}
        >
          <SessionCreateForm
            defaultActivity={createSessionModal}
            afterSubmitHandler={() => {
              startTimer();
              navigate('/timer');
            }}
          />
        </Modal>
      )}

      <div className="container flex justify-between">
        <div>
          <div className="mb-5 text-xl font-bold">All activities</div>
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
          <Button onClick={() => setManageModal(true)}>
            Create new activity
          </Button>
        </div>
      </div>
    </>
  );
};

export default ActivitiesPage;
