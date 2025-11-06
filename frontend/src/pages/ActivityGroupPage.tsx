import { FC, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useQueryCustom } from '../hooks/useQueryCustom';
import {
  fetchActivityGroup,
  archiveAllActivities,
} from '../api/activityGroupApi';
import { fetchGroupActivities } from '../api/activityApi';
import { toast } from 'react-toastify';

import Title from '../components/Title';
import CrossIcon from '../icons/CrossIcon';
import ActivityCreateForm from '../components/forms/ActivityCreateForm';
import ActivityItem from '../components/ActivityItem';
import Button from '../components/Button';
import Modal from '../components/modals/Modal';
import PrimaryClipLoader from '../components/PrimaryClipLoader';

import { IActivity } from '../ts/interfaces/Activity/IActivity';

const ActivityGroupPage: FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { activityGroupId } = useParams();

  const {
    data: currentActivityGroup,
    isLoading: isLoadingGroup,
    isError: isErrorGroup,
  } = useQueryCustom({
    queryKey: ['activityGroup', activityGroupId],
    queryFn: () => fetchActivityGroup(activityGroupId!),
  });
  const {
    data: activities,
    isLoading: isLoadingActivity,
    isError: isErrorActivities,
  } = useQueryCustom({
    queryKey: ['activities', activityGroupId],
    queryFn: () => fetchGroupActivities(activityGroupId!),
  });

  const isLoading = isLoadingActivity || isLoadingGroup;

  const [createModal, setCreateModal] = useState<boolean>(false);
  const [searchString, setSearchString] = useState<string>('');

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

  const onArchiveAllActivities = async () => {
    // TODO: отображать серверную ошибку

    try {
      await archiveAllActivities(currentActivityGroup!.id);

      queryClient.setQueryData(
        ['activities', activityGroupId],
        (oldData: IActivity[]) =>
          oldData.map((activity) => ({ ...activity, archived: true }))
      );
    } catch (e) {
      toast('A server error occurred while archiving all activities', {
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

      {isLoading ? (
        <div className="mt-5 text-center">
          <PrimaryClipLoader />
        </div>
      ) : (
        currentActivityGroup &&
        activities && (
          <div className="container my-5">
            <div className="dark:text-textDark">
              <span
                onClick={() => navigate('/activity-groups')}
                className="transition duration-300 cursor-pointer hover:text-primary"
              >
                Activity groups
              </span>{' '}
              / {currentActivityGroup.name}
            </div>

            <div className="flex items-center justify-between mt-5">
              {currentActivityGroup && (
                <Title>{currentActivityGroup.name}</Title>
              )}
              <div className="flex h-full gap-5">
                <div className="relative flex">
                  <input
                    value={searchString}
                    onChange={(e) => setSearchString(e.target.value)}
                    className="transition duration-300 bg-transparent border-b border-solid border-b-gray-500 focus:border-b-primary dark:text-textDark"
                    type="text"
                    placeholder="Search..."
                  />
                  {searchString && (
                    <button
                      className="absolute right-0 z-10 top-[6px]"
                      onClick={() => setSearchString('')}
                    >
                      <CrossIcon />
                    </button>
                  )}
                </div>
                <Button onClick={() => setCreateModal(true)}>
                  Create new activity
                </Button>
              </div>
            </div>

            <div className="flex items-end gap-7 mt-7">
              <div className="text-xl font-bold dark:text-textDark">
                Activities
              </div>

              <div className="w-fit">
                <Button onClick={onArchiveAllActivities}>
                  Archive all activities
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-7">
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
                      afterUpdateHandler={(updatedActivity) => {
                        queryClient.setQueryData(
                          ['activities', activityGroupId],
                          (oldData: IActivity[]) =>
                            oldData.map((activity) =>
                              activity.id == updatedActivity.id
                                ? updatedActivity
                                : activity
                            )
                        );
                      }}
                      afterDeleteHandler={(deletedItemId) => {
                        queryClient.setQueryData(
                          ['activities', activityGroupId],
                          (oldData: IActivity[]) =>
                            oldData.filter(
                              (activity) => activity.id !== deletedItemId
                            )
                        );
                      }}
                    />
                  ))
              ) : (
                <div className="dark:text-textDark">Not found</div>
              )}
            </div>
          </div>
        )
      )}
    </>
  );
};

export default ActivityGroupPage;
