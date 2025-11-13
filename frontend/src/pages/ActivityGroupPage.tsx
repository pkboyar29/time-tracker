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

import Title from '../components/common/Title';
import SearchBar from '../components/common/SearchBar';
import ActivityCreateForm from '../components/forms/ActivityCreateForm';
import ActivityItem from '../components/ActivityItem';
import Button from '../components/common/Button';
import Modal from '../components/modals/Modal';
import PrimaryClipLoader from '../components/common/PrimaryClipLoader';

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
        <div className="my-[65px] xl:my-5 text-center">
          <PrimaryClipLoader />
        </div>
      ) : (
        currentActivityGroup &&
        activities && (
          <div className="container my-[65px] xl:my-5">
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
                <SearchBar
                  searchString={searchString}
                  setSearchString={setSearchString}
                  compact={true}
                  className="hidden md:flex"
                />

                <div className="hidden md:block w-fit">
                  <Button onClick={() => setCreateModal(true)}>
                    Create new activity group
                  </Button>
                </div>

                <button
                  className="fixed z-50 flex items-center justify-center text-3xl font-semibold leading-none text-white transition-colors duration-300 rounded-full shadow-lg w-14 h-14 md:hidden bottom-6 right-6 bg-primary hover:bg-primaryHover dark:text-textDark"
                  onClick={() => setCreateModal(true)}
                >
                  +
                </button>
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

            <div className="flex justify-end mt-4 md:hidden">
              <SearchBar
                searchString={searchString}
                setSearchString={setSearchString}
                compact={false}
                className="flex md:hidden"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-4 md:justify-start mt-7">
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
