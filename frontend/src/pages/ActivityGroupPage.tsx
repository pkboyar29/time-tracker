import { FC, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { useTimer } from '../context/TimerContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchActivityGroup } from '../api/activityGroupApi';
import { fetchActivities, deleteActivity } from '../api/activityApi';
import { updateSession } from '../redux/slices/sessionSlice';
import { toast } from 'react-toastify';

import CloseIcon from '@mui/icons-material/Close';
import ActivityCreateForm from '../components/forms/ActivityCreateForm';
import ActivityCommonUpdateForm from '../components/forms/ActivityCommonUpdateForm';
import ActivityItem from '../components/ActivityItem';
import Button from '../components/Button';
import Modal from '../components/modals/Modal';
import SessionCreateModal from '../components/modals/SessionCreateModal';
import { ClipLoader } from 'react-spinners';

import { IActivity } from '../ts/interfaces/Activity/IActivity';

interface ModalState {
  status: boolean;
  selectedItemId: string | null;
}

const ActivityGroupPage: FC = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { activityGroupId } = useParams();

  const currentSession = useAppSelector(
    (state) => state.sessions.currentSession
  );

  const {
    data: currentActivityGroup,
    isLoading: isLoadingGroup,
    isError: isErrorGroup,
  } = useQuery({
    queryKey: ['activityGroup', activityGroupId],
    queryFn: () => fetchActivityGroup(activityGroupId!),
    retry: false,
  });
  const {
    data: activities,
    isLoading: isLoadingActivity,
    isError: isErrorActivities,
  } = useQuery({
    queryKey: ['activities', activityGroupId],
    queryFn: () => fetchActivities(activityGroupId!),
    retry: false,
  });

  const isLoading = isLoadingActivity || isLoadingGroup;

  const [createModal, setCreateModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<ModalState>({
    status: false,
    selectedItemId: null,
  });
  const [createSessionModal, setCreateSessionModal] = useState<ModalState>({
    status: false,
    selectedItemId: null,
  });
  const [searchString, setSearchString] = useState<string>('');

  const { toggleTimer } = useTimer();

  useEffect(() => {
    if (isErrorGroup) {
      toast('A server error occurred while getting activity group', {
        type: 'error',
      });
    }
  }, [isErrorGroup]);

  useEffect(() => {
    if (isErrorActivities) {
      toast('A server error occurred while getting activities for group', {
        type: 'error',
      });
    }
  }, [isErrorActivities]);

  const handleDeleteActivityClick = async (activityId: string) => {
    try {
      await deleteActivity(activityId);

      queryClient.setQueryData(
        ['activities', activityGroupId],
        (oldData: IActivity[]) =>
          oldData.filter((activity) => activity.id !== activityId)
      );

      setDeleteModal({ status: false, selectedItemId: null });
    } catch (e) {
      setDeleteModal({ status: false, selectedItemId: null });
      toast('A server error occurred while deleting activity', {
        type: 'error',
      });
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
                queryClient.setQueryData(
                  ['activities', activityGroupId],
                  (oldData: IActivity[]) => [newActivity, ...oldData]
                );

                setCreateModal(false);
              }}
              activityGroupId={currentActivityGroup.id}
            />
          )}
        </Modal>
      )}

      {deleteModal.status && (
        <Modal
          title="Deleting activity"
          onCloseModal={() =>
            setDeleteModal({ status: false, selectedItemId: null })
          }
        >
          <p className="mb-4 text-[15px]">
            Are you sure you want to delete this activity?
          </p>
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

      {createSessionModal.status && (
        <SessionCreateModal
          modalTitle={
            <div>
              <span className="font-bold">
                {
                  activities?.find(
                    (activity) =>
                      activity.id === createSessionModal.selectedItemId
                  )?.name
                }
              </span>
              : starting new session
            </div>
          }
          onCloseModal={() => {
            setCreateSessionModal({ status: false, selectedItemId: null });
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

      {isLoading ? (
        <div className="mt-5 text-center">
          <ClipLoader color="#EF4444" />
        </div>
      ) : (
        currentActivityGroup &&
        activities && (
          <div className="container my-5">
            <div>
              <span
                onClick={() => navigate('/activity-groups')}
                className="transition duration-300 cursor-pointer hover:text-red-500"
              >
                Activity groups
              </span>{' '}
              / {currentActivityGroup.name}
            </div>

            <div className="flex justify-between mt-5">
              {currentActivityGroup && (
                <ActivityCommonUpdateForm
                  activityCommon={currentActivityGroup}
                  afterUpdateHandler={(updatedGroup) => {
                    if (!('activityGroup' in updatedGroup)) {
                      queryClient.setQueryData(
                        ['activityGroup', activityGroupId],
                        () => updatedGroup
                      );
                    }
                  }}
                />
              )}
              <div className="flex h-full gap-5">
                <div className="relative flex">
                  <input
                    value={searchString}
                    onChange={(e) => setSearchString(e.target.value)}
                    className="transition duration-300 bg-transparent border-b border-solid border-b-gray-500 focus:border-b-red-500"
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
                    activity.name
                      .toLowerCase()
                      .includes(searchString.toLowerCase())
                  )
                  .map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      activityCommon={activity}
                      editHandler={() => console.log('edit handler')}
                      afterBlurHandler={(updatedActivity) => {
                        queryClient.setQueryData(
                          ['activities', activityGroupId],
                          (oldData: IActivity[]) =>
                            oldData.filter((activity) =>
                              activity.id == updatedActivity.id
                                ? updatedActivity
                                : activity
                            )
                        );
                      }}
                      deleteHandler={(activityId: string) =>
                        setDeleteModal({
                          status: true,
                          selectedItemId: activityId,
                        })
                      }
                      startSessionHandler={() =>
                        setCreateSessionModal({
                          status: true,
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
        )
      )}
    </>
  );
};

export default ActivityGroupPage;
