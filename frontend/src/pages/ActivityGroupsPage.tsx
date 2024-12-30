import { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useAppDispatch } from '../redux/store';
import { useNavigate } from 'react-router-dom';
import {
  deleteActivityGroup,
  fetchActivityGroups,
} from '../redux/slices/activityGroupSlice';

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
  const activityGroups = useSelector(
    (state: RootState) => state.activityGroups.activityGroups
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [createModal, setCreateModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>();

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

      <div className="container flex justify-between mt-5">
        <div>
          <Title>All activity groups</Title>
          <div className="flex flex-col gap-4 mt-5">
            {activityGroups.map((activityGroup) => (
              <ActivityItem
                key={activityGroup.id}
                activity={activityGroup}
                editHandler={handleEditActivityGroupClick}
                deleteHandler={handleDeleteActivityGroupClick}
              ></ActivityItem>
            ))}
          </div>
        </div>
        <div className="flex h-full gap-5">
          <Button onClick={() => setCreateModal(true)}>
            Create new activity group
          </Button>
        </div>
      </div>
    </>
  );
};

export default ActivityGroupsPage;
