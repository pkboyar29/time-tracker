import { FC, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { useQueryCustom } from '../hooks/useQueryCustom';
import { fetchActivityGroups } from '../api/activityGroupApi';

import PrimaryClipLoader from '../components/common/PrimaryClipLoader';
import Button from '../components/common/Button';
import Modal from '../components/modals/Modal';
import Title from '../components/common/Title';
import SearchBar from '../components/common/SearchBar';
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

      <div className="container my-[65px] xl:my-5">
        <div className="flex items-center justify-between">
          <Title>All activity groups</Title>

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

        <div className="flex justify-end mt-4 md:hidden">
          <SearchBar
            searchString={searchString}
            setSearchString={setSearchString}
            compact={false}
            className="flex md:hidden"
          />
        </div>

        {isLoading ? (
          <div className="mt-5 text-center">
            <PrimaryClipLoader />
          </div>
        ) : (
          activityGroups && (
            <div className="flex flex-wrap justify-center gap-4 mt-5 md:justify-start">
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
