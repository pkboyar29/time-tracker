import { FC, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { useNavigate } from 'react-router-dom';
import {
  deleteActivityGroup,
  fetchActivityGroups,
} from '../redux/slices/activityGroupSlice';

import CloseIcon from '@mui/icons-material/Close';
import Button from '../components/Button';
import Modal from '../components/modals/Modal';
import Title from '../components/Title';
import ActivityItem from '../components/ActivityItem';
import ActivityGroupCreateForm from '../components/forms/ActivityGroupCreateForm';

interface DeleteModalState {
  deleteModal: boolean;
  deletedGroupId: string | null;
}

const ActivityGroupsPage: FC = () => {
  const activityGroups = useAppSelector(
    (state) => state.activityGroups.activityGroups
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [createModal, setCreateModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>();

  const [searchString, setSearchString] = useState<string>('');

  useEffect(() => {
    dispatch(fetchActivityGroups());
  }, []);

  const handleEditActivityGroupClick = (activityGroupId: string) => {
    navigate(`${activityGroupId}`);
  };

  const handleDeleteActivityGroupClick = (activityGroupId: string) => {
    setDeleteModal({
      deleteModal: true,
      deletedGroupId: activityGroupId,
    });
  };

  const handleDeleteActivityGroupModal = () => {
    if (deleteModal?.deletedGroupId) {
      dispatch(deleteActivityGroup(deleteModal?.deletedGroupId));
    }
    setDeleteModal({
      deleteModal: false,
      deletedGroupId: null,
    });
  };

  return (
    <>
      {createModal && (
        <Modal
          title="Creating new activity group"
          onCloseModal={() => setCreateModal(false)}
        >
          <ActivityGroupCreateForm
            afterSubmitHandler={() => {
              setCreateModal(false);
            }}
          />
        </Modal>
      )}

      {deleteModal?.deleteModal && (
        <Modal
          title="Deleting activity group"
          onCloseModal={() => setCreateModal(false)}
        >
          <Button onClick={handleDeleteActivityGroupModal}>
            Delete activity group
          </Button>
        </Modal>
      )}

      <div className="container">
        <div className="flex justify-between mt-5">
          <Title>All activity groups</Title>
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
              Create new activity group
            </Button>
          </div>
        </div>

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
                  activity={activityGroup}
                  editHandler={handleEditActivityGroupClick}
                  deleteHandler={handleDeleteActivityGroupClick}
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

export default ActivityGroupsPage;
