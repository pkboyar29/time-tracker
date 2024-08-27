import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useAppDispatch } from '../redux/store';
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
import { mapActivityGroupFromResponse } from '../helpers/mappingHelpers';

interface ModalState {
  modal: boolean;
  selectedItemId: string | null;
}

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
  const [deleteModal, setDeleteModal] = useState<ModalState>();
  const [createSessionModal, setCreateSessionModal] = useState<ModalState>();
  const [searchString, setSearchString] = useState<string>('');
  const { startTimer } = useTimer();

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
    if (activityGroupId) {
      dispatch(fetchActivities(activityGroupId));
    }
  }, [activityGroupId]);

  const handleEditActivityClick = (activityId: string) => {
    navigate(`activities/${activityId}`);
  };

  const handleDeleteActivityClick = (activityId: string) => {
    setDeleteModal({ modal: false, selectedItemId: null });
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

      {createSessionModal && (
        <Modal
          title={
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
          onCloseModal={() =>
            setCreateSessionModal({ modal: false, selectedItemId: null })
          }
        >
          <SessionCreateForm
            defaultActivity={
              createSessionModal.selectedItemId
                ? createSessionModal.selectedItemId
                : undefined
            }
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
