import { FC, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { useQueryCustom } from '../hooks/useQueryCustom';
import { fetchActivityGroups } from '../api/activityGroupApi';

import CrossIcon from '../icons/CrossIcon';
import PrimaryClipLoader from '../components/PrimaryClipLoader';
import Button from '../components/Button';
import Modal from '../components/modals/Modal';
import Title from '../components/Title';
import ActivityItem from '../components/ActivityItem';
import ActivityGroupCreateForm from '../components/forms/ActivityGroupCreateForm';

import { IActivityGroup } from '../ts/interfaces/ActivityGroup/IActivityGroup';

const ActivityGroupsPage: FC = () => {
  const queryClient = useQueryClient();

  const {
    data: activityGroups,
    isLoading,
    isError,
  } = useQueryCustom({
    queryKey: ['activityGroups'],
    queryFn: () => fetchActivityGroups(),
  });

  const [createModal, setCreateModal] = useState<boolean>(false);

  const [searchString, setSearchString] = useState<string>('');

  useEffect(() => {
    if (isError) {
      toast('A server error occurred while getting activity groups', {
        type: 'error',
      });
    }
  }, [isError]);

  return (
    <>
      {createModal && (
        <Modal
          title="Creating new activity group"
          onCloseModal={() => setCreateModal(false)}
        >
          <ActivityGroupCreateForm
            afterSubmitHandler={(newActivityGroup) => {
              queryClient.setQueryData(
                ['activityGroups'],
                (oldData: IActivityGroup[]) => [newActivityGroup, ...oldData]
              );

              setCreateModal(false);
            }}
          />
        </Modal>
      )}

      <div className="container my-5">
        <div className="flex justify-between">
          <Title>All activity groups</Title>
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
              Create new activity group
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-5 text-center">
            <PrimaryClipLoader />
          </div>
        ) : (
          activityGroups && (
            <div className="flex flex-wrap gap-4 mt-5">
              {activityGroups.filter((activityGroup) =>
                activityGroup.name
                  .toLowerCase()
                  .includes(searchString.toLowerCase())
              ).length !== 0 ? (
                activityGroups
                  .filter((activityGroup) =>
                    activityGroup.name
                      .toLowerCase()
                      .includes(searchString.toLowerCase())
                  )
                  .map((activityGroup) => (
                    <ActivityItem
                      key={activityGroup.id}
                      activityCommon={activityGroup}
                      afterUpdateHandler={(updatedGroup) => {
                        queryClient.setQueryData(
                          ['activityGroups'],
                          (oldData: IActivityGroup[]) =>
                            oldData.map((group) =>
                              group.id == updatedGroup.id ? updatedGroup : group
                            )
                        );
                      }}
                      afterDeleteHandler={(deletedItemId) => {
                        queryClient.setQueryData(
                          ['activityGroups'],
                          (oldData: IActivityGroup[]) =>
                            oldData.filter(
                              (group) => group.id !== deletedItemId
                            )
                        );
                      }}
                    />
                  ))
              ) : (
                <div className="text-base dark:text-textDark">Not found</div>
              )}
            </div>
          )
        )}
      </div>
    </>
  );
};

export default ActivityGroupsPage;
