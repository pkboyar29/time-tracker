import { FC, useState } from 'react';
import { updateActivityGroup } from '../api/activityGroupApi';
import { updateActivity } from '../api/activityApi';
import { getTimeHoursMinutesSeconds } from '../helpers/timeHelpers';
import { toast } from 'react-toastify';

import { IActivity } from '../ts/interfaces/Activity/IActivity';
import { IActivityGroup } from '../ts/interfaces/ActivityGroup/IActivityGroup';

import Button from './Button';
import DeleteIcon from '../icons/DeleteIcon';
import EditIcon from '../icons/EditIcon';
import SaveIcon from '../icons/SaveIcon';
import PlayIcon from '../icons/PlayIcon';

interface ActivityBoxProps {
  activityCommon: IActivity | IActivityGroup;
  editHandler: (activityId: string) => void;
  deleteHandler: (activityId: string) => void;
  startSessionHandler?: (activityId: string) => void;
  afterBlurHandler?: (updatedActivity: IActivity | IActivityGroup) => void;
}

const ActivityItem: FC<ActivityBoxProps> = ({
  activityCommon,
  editHandler,
  deleteHandler,
  startSessionHandler,
  afterBlurHandler,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(activityCommon.name);

  const inputChangeHandler = async (e: React.FormEvent<HTMLInputElement>) => {
    setName(e.currentTarget.value);
  };

  const handleEditButtonClick = () => {
    if (afterBlurHandler) {
      if (isEditing) {
        onSubmit();
      }

      setIsEditing((isEditing) => !isEditing);
    } else {
      editHandler(activityCommon.id);
    }
  };

  const handleDeleteButtonClick = () => {
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

        afterBlurHandler && afterBlurHandler(updatedData);
      } catch (e) {
        toast('A server error occurred while updating activity', {
          type: 'error',
        });
        setName(activityCommon.name);
      }
    } else {
      // IActivityGroup
      try {
        const updatedData = await updateActivityGroup({
          id: activityCommon.id,
          name,
        });

        afterBlurHandler && afterBlurHandler(updatedData);
      } catch (e) {
        toast('A server error occurred while updating activity group', {
          type: 'error',
        });
        setName(activityCommon.name);
      }
    }
  };

  return (
    <div className="p-5 bg-white border border-gray-300/80 border-solid rounded-xl w-[320px] min-h-[150px] flex flex-col">
      <div className="flex items-start justify-between flex-1 gap-5">
        <input
          value={name}
          onChange={inputChangeHandler}
          onBlur={() => {
            onSubmit();
            setIsEditing(false);
          }}
          className={`w-full border border-solid rounded-lg bg-transparent text-base p-0.5 text-red-500 ${
            isEditing ? 'border-gray-300' : 'border-transparent text-ellipsis'
          }`}
          maxLength={50}
          disabled={!isEditing}
        />

        <div className="flex gap-2">
          <button
            className="p-1 rounded-lg hover:bg-[#F1F1F1] transition duration-300"
            onClick={handleEditButtonClick}
          >
            {isEditing ? <SaveIcon /> : <EditIcon />}
          </button>
          <button
            className="p-1 rounded-lg hover:bg-[#F1F1F1] transition duration-300"
            onClick={handleDeleteButtonClick}
          >
            <DeleteIcon />
          </button>
        </div>
      </div>

      {startSessionHandler && 'activityGroup' in activityCommon && (
        <div className="flex justify-end mt-4">
          <div className="w-fit">
            <Button onClick={() => startSessionHandler(activityCommon.id)}>
              <div className="flex gap-[6px] items-center">
                <span>Start session</span>
                <PlayIcon />
              </div>
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-6 mt-6">
        <div className="text-center">
          <div className="font-bold">{activityCommon.sessionsAmount}</div>
          <div className="text-[13px]">sessions</div>
        </div>
        <div className="text-center">
          <div className="font-bold">
            {getTimeHoursMinutesSeconds(activityCommon.spentTimeSeconds)}
          </div>
          <div className="text-[13px]">spent time</div>
        </div>
      </div>
    </div>
  );
};

export default ActivityItem;
