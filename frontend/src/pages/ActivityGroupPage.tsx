import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { fetchActivities, deleteActivity } from '../redux/slices/activitySlice';
import { useTimer } from '../context/TimerContext';
import { useParams } from 'react-router-dom';
import { updateSession } from '../redux/slices/sessionSlice';
import axios from '../axios';

import CloseIcon from '@mui/icons-material/Close';
import ActivityCreateForm from '../components/forms/ActivityCreateForm';
import ActivityCommonUpdateForm from '../components/forms/ActivityCommonUpdateForm';
import ActivityItem from '../components/ActivityItem';
import Button from '../components/Button';
import Modal from '../components/modals/Modal';
import SessionCreateModal from '../components/modals/SessionCreateModal';

import { IActivityGroup } from '../ts/interfaces/ActivityGroup/IActivityGroup';
import { IActivity } from '../ts/interfaces/Activity/IActivity';
import { mapActivityGroupFromResponse } from '../helpers/mappingHelpers';

interface ModalState {
  modal: boolean;
  selectedItemId: string | null;
}

const ActivityGroupPage: FC = () => {
  const currentSession = useAppSelector(
    (state) => state.sessions.currentSession
  );
  const { activityGroupId } = useParams();
  const [currentActivityGroup, setCurrentActivityGroup] =
    useState<IActivityGroup>();

  const [activities, setActivities] = useState<IActivity[]>([]);

  const [createModal, setCreateModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<ModalState>();
  const [createSessionModal, setCreateSessionModal] = useState<ModalState>();
  const [searchString, setSearchString] = useState<string>('');
  const { toggleTimer } = useTimer();

  const dispatch = useAppDispatch();
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
    const fetch = async () => {
      if (activityGroupId) {
        const payload = await dispatch(
          fetchActivities(activityGroupId)
        ).unwrap();

        setActivities(payload);
      }
    };

    fetch();
  }, [activityGroupId]);

  const handleEditActivityClick = (activityId: string) => {
    navigate(`activities/${activityId}`);
  };

  const handleDeleteActivityClick = async (activityId: string) => {
    try {
      await dispatch(deleteActivity(activityId)).unwrap();

      setActivities((activities) =>
        activities.filter((activity) => activity.id !== activityId)
      );

      setDeleteModal({ modal: false, selectedItemId: null });
    } catch (e) {
      console.log(e);
    }
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
              afterSubmitHandler={(newActivity) => {
                setActivities((activities) => [...activities, newActivity]);

                setCreateModal(false);
              }}
              activityGroupId={currentActivityGroup.id}
            />
          )}
        </Modal>
      )}

      {deleteModal?.modal && (
        <Modal
          title="Deleting activity"
          onCloseModal={() =>
            setDeleteModal({ modal: false, selectedItemId: null })
          }
        >
          <Button
            onClick={() =>
              deleteModal.selectedItemId &&
              handleDeleteActivityClick(deleteModal.selectedItemId)
            }
          >
            Delete activity
          </Button>
        </Modal>
      )}

      {createSessionModal?.modal && (
        <SessionCreateModal
          modalTitle={
            <div>
              <span className="font-bold">
                {
                  activities.find(
                    (activity) =>
                      activity.id === createSessionModal.selectedItemId
                  )?.name
                }
              </span>
              : starting new session
            </div>
          }
          onCloseModal={() => {
            setCreateSessionModal({ modal: false, selectedItemId: null });
          }}
          defaultActivity={
            createSessionModal.selectedItemId
              ? createSessionModal.selectedItemId
              : undefined
          }
          afterSubmitHandler={() => {
            if (currentSession) {
              dispatch(updateSession(currentSession));
            }

            toggleTimer(0);
            navigate('/timer');
          }}
        />
      )}

      <div className="container">
        <div className="mt-5">
          <span
            onClick={() => navigate('/activity-groups')}
            className="transition duration-300 cursor-pointer hover:text-red-500"
          >
            Activity groups
          </span>{' '}
          / {currentActivityGroup?.name}
        </div>

        <div className="flex justify-between mt-5">
          {currentActivityGroup && (
            <ActivityCommonUpdateForm activityCommon={currentActivityGroup} />
          )}
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

        <div className="my-5 text-xl font-bold">All activities</div>
        <div className="flex flex-wrap gap-4">
          {activities.filter((activity) =>
            activity.name.toLowerCase().includes(searchString.toLowerCase())
          ).length !== 0 ? (
            activities
              .filter((activity) =>
                activity.name.toLowerCase().includes(searchString.toLowerCase())
              )
              .map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  editHandler={handleEditActivityClick}
                  deleteHandler={(activityId: string) =>
                    setDeleteModal({
                      modal: true,
                      selectedItemId: activityId,
                    })
                  }
                  startSessionHandler={() =>
                    setCreateSessionModal({
                      modal: true,
                      selectedItemId: activity.id,
                    })
                  }
                />
              ))
          ) : (
            <>Not found</>
          )}
        </div>
      </div>
    </>
  );
};

export default ActivityGroupPage;
