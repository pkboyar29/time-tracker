import { FC, useState } from 'react';
import { updateActivityGroup } from '../api/activityGroupApi';
import { updateActivity } from '../api/activityApi';
import { getTimeHoursMinutesSeconds } from '../helpers/timeHelpers';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';

import { IActivity } from '../ts/interfaces/Activity/IActivity';
import { IActivityGroup } from '../ts/interfaces/ActivityGroup/IActivityGroup';
import { ModalState } from '../ts/interfaces/ModalState';

import Button from './Button';
import DeleteIcon from '../icons/DeleteIcon';
import EditIcon from '../icons/EditIcon';
import SaveIcon from '../icons/SaveIcon';
import SessionCreateModal from './modals/SessionCreateModal';

interface ActivityBoxProps {
  activityCommon: IActivity | IActivityGroup;
  editHandler: (activityId: string) => void;
  deleteHandler: (activityId: string) => void;
  afterUpdateHandler?: (updatedActivity: IActivity | IActivityGroup) => void;
}

const ActivityItem: FC<ActivityBoxProps> = ({
  activityCommon,
  editHandler,
  deleteHandler,
  afterUpdateHandler,
}) => {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(activityCommon.name);

  const [startSessionModal, setStartSessionModal] = useState<ModalState>({
    status: false,
    selectedItemId: null,
  });

  const inputChangeHandler = async (e: React.FormEvent<HTMLInputElement>) => {
    setName(e.currentTarget.value);
  };

  const editButtonClickHandler = () => {
    if (afterUpdateHandler) {
      if (isEditing && name != activityCommon.name) {
        onSubmit();
      }

      setIsEditing((isEditing) => !isEditing);
    } else {
      editHandler(activityCommon.id);
    }
  };

  const deleteButtonClickHandler = () => {
    deleteHandler(activityCommon.id);
  };

  const onSubmit = async () => {
    if ('activityGroup' in activityCommon) {
      // IActivity
      try {
        const updatedData = await updateActivity({
          id: activityCommon.id,
          name,
        });

        afterUpdateHandler && afterUpdateHandler(updatedData);
      } catch (e) {
        if (e instanceof AxiosError) {
          toast(
            e.response
              ? e.response.data
              : 'A server error occurred while updating activity',
            {
              type: 'error',
            }
          );
        } else {
          toast('A server error occurred while updating activity', {
            type: 'error',
          });
        }
        setName(activityCommon.name);
      }
    } else {
      // IActivityGroup
      try {
        const updatedData = await updateActivityGroup({
          id: activityCommon.id,
          name,
        });

        afterUpdateHandler && afterUpdateHandler(updatedData);
      } catch (e) {
        if (e instanceof AxiosError) {
          toast(
            e.response
              ? e.response.data
              : 'A server error occurred while updating activity group',
            {
              type: 'error',
            }
          );
        } else {
          toast('A server error occurred while updating activity group', {
            type: 'error',
          });
        }
        setName(activityCommon.name);
      }
    }
  };

  const afterCreateSessionHandler = () => {
    navigate('/timer');
  };

  return (
    <>
      {startSessionModal.status && (
        <SessionCreateModal
          modalTitle={
            <div>
              <span className="font-bold">{activityCommon.name}</span>: starting
              new session
            </div>
          }
          onCloseModal={() => {
            setStartSessionModal({ status: false, selectedItemId: null });
          }}
          defaultActivity={
            startSessionModal.selectedItemId
              ? startSessionModal.selectedItemId
              : undefined
          }
          afterSubmitHandler={afterCreateSessionHandler}
        />
      )}

      <div className="p-5 bg-surfaceLight dark:bg-surfaceDark border border-gray-300/80 dark:border-gray-500 border-solid rounded-xl w-[320px] min-h-[150px] flex flex-col">
        <div className="flex items-start justify-between flex-1 gap-5">
          <input
            value={name}
            onChange={inputChangeHandler}
            onBlur={editButtonClickHandler}
            className={`w-full border border-solid rounded-lg bg-transparent text-base p-0.5 text-primary dark:text-textDark ${
              isEditing
                ? 'border-gray-300 dark:border-gray-500'
                : 'border-transparent text-ellipsis'
            }`}
            minLength={1}
            maxLength={50}
            disabled={!isEditing}
          />

          <div className="flex gap-2">
            <button
              className="p-1 transition duration-300 rounded-lg hover:bg-surfaceLightHover dark:hover:bg-surfaceDarkHover"
              onClick={editButtonClickHandler}
            >
              {isEditing ? <SaveIcon /> : <EditIcon />}
            </button>
            <button
              className="p-1 transition duration-300 rounded-lg hover:bg-surfaceLightHover dark:hover:bg-surfaceDarkHover"
              onClick={deleteButtonClickHandler}
            >
              <DeleteIcon />
            </button>
          </div>
        </div>

        {'activityGroup' in activityCommon && (
          <div className="flex justify-end mt-4">
            <div className="w-fit">
              <Button
                onClick={() =>
                  setStartSessionModal({
                    status: true,
                    selectedItemId: activityCommon.id,
                  })
                }
              >
                <div className="flex gap-[6px] items-center">
                  <span>Start session</span>
                </div>
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-6 mt-6">
          <div className="text-center">
            <div className="font-bold dark:text-textDark">
              {activityCommon.sessionsAmount}
            </div>
            <div className="text-[13px] dark:text-textDarkSecondary">
              sessions
            </div>
          </div>
          <div className="text-center">
            <div className="font-bold dark:text-textDark">
              {getTimeHoursMinutesSeconds(activityCommon.spentTimeSeconds)}
            </div>
            <div className="text-[13px] dark:text-textDarkSecondary">
              spent time
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActivityItem;
