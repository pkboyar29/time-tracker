import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchActivityGroups,
  deleteActivityGroup,
} from '../api/activityGroupApi';

import { ClipLoader } from 'react-spinners';
import CloseIcon from '@mui/icons-material/Close';
import Button from '../components/Button';
import Modal from '../components/modals/Modal';
import Title from '../components/Title';
import ActivityItem from '../components/ActivityItem';
import ActivityGroupCreateForm from '../components/forms/ActivityGroupCreateForm';

import { IActivityGroup } from '../ts/interfaces/ActivityGroup/IActivityGroup';
import { ModalState } from '../ts/interfaces/ModalState';

const ActivityGroupsPage: FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: activityGroups,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['activityGroups'],
    queryFn: () => fetchActivityGroups(),
    retry: false,
  });

  const [createModal, setCreateModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<ModalState>({
    status: false,
    selectedItemId: null,
  });

  const [searchString, setSearchString] = useState<string>('');

  useEffect(() => {
    if (isError) {
      toast('A server error occurred while getting activity groups', {
        type: 'error',
      });
    }
  }, [isError]);

  const handleEditActivityGroupClick = (activityGroupId: string) => {
    navigate(`${activityGroupId}`);
  };

  const handleDeleteActivityGroupClick = (activityGroupId: string) => {
    setDeleteModal({
      status: true,
      selectedItemId: activityGroupId,
    });
  };

  const handleDeleteActivityGroupModal = async () => {
    if (deleteModal.selectedItemId) {
      try {
        await deleteActivityGroup(deleteModal.selectedItemId);

        queryClient.setQueryData(
          ['activityGroups'],
          (oldData: IActivityGroup[]) =>
            oldData.filter((group) => group.id !== deleteModal.selectedItemId)
        );

        setDeleteModal({
          status: false,
          selectedItemId: null,
        });
      } catch (e) {
        setDeleteModal({
          status: false,
          selectedItemId: null,
        });
        toast('A server error occurred while deleting activity group', {
          type: 'error',
        });
      }
    }
  };

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

      {deleteModal.status && (
        <Modal
          title="Deleting activity group"
          onCloseModal={() =>
            setDeleteModal({ status: false, selectedItemId: null })
          }
        >
          <p className="mb-4 text-[15px]">
            Are you sure you want to delete this activity group?
          </p>
          <Button onClick={handleDeleteActivityGroupModal}>
            Delete activity group
          </Button>
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
              Create new activity group
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-5 text-center">
            <ClipLoader color="#EF4444" />
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
                      editHandler={handleEditActivityGroupClick}
                      deleteHandler={handleDeleteActivityGroupClick}
                    />
                  ))
              ) : (
                <div className="text-base">Not found</div>
              )}
            </div>
          )
        )}
      </div>
    </>
  );
};

export default ActivityGroupsPage;
