import { FC, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { useNavigate } from 'react-router-dom';
import {
  deleteActivityGroup,
  fetchActivityGroups,
} from '../redux/slices/activityGroupSlice';

import Button from '../components/Button';
import Modal from '../components/Modal';
import ActivityItem from '../components/ActivityItem';
import ActivityGroupCreateForm from '../components/forms/ActivityGroupCreateForm';

interface DeleteModalState {
  deleteModal: boolean;
  deletedGroupId: string | null;
}

const ActivityGroupPage: FC = () => {
  const activityGroups = useSelector(
    (state: RootState) => state.activityGroups.activityGroups
  );
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [createModal, setCreateModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>();

  useEffect(() => {
    dispatch(fetchActivityGroups());
  }, []);

  const onEditActivityGroupClick = (activityGroupId: string) => {
    navigate(`${activityGroupId}`);
  };

  const onDeleteActivityGroupClick = (activityGroupId: string) => {
    setDeleteModal({
      deleteModal: true,
      deletedGroupId: activityGroupId,
    });
  };

  const onDeleteActivityGroupModal = () => {
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
          <Button onClick={onDeleteActivityGroupModal}>
            Delete activity group
          </Button>
        </Modal>
      )}

      <div className="container flex justify-between">
        <div>
          <div className="mb-5 text-xl font-bold">All activity groups</div>
          <div className="flex flex-col gap-4">
            {activityGroups.map((activityGroup) => (
              <ActivityItem
                key={activityGroup.id}
                activity={activityGroup}
                editHandler={onEditActivityGroupClick}
                deleteHandler={onDeleteActivityGroupClick}
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

export default ActivityGroupPage;
