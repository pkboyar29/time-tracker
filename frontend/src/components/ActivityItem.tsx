import { FC } from 'react';

import { getTimeHoursMinutesSeconds } from '../helpers/timeHelpers';
import { IActivity } from '../ts/interfaces/Activity/IActivity';
import { IActivityGroup } from '../ts/interfaces/ActivityGroup/IActivityGroup';

import Button from './Button';
import DeleteIcon from '../icons/DeleteIcon';
import EditIcon from '../icons/EditIcon';
import PlayIcon from '../icons/PlayIcon';

interface ActivityBoxProps {
  activity: IActivity | IActivityGroup;
  editHandler: (activityId: string) => void;
  deleteHandler: (activityId: string) => void;
  startSessionHandler?: (activityId: string) => void;
}

const ActivityItem: FC<ActivityBoxProps> = ({
  activity,
  editHandler,
  deleteHandler,
  startSessionHandler,
}) => {
  return (
    <div className="p-5 bg-white border border-gray-300/80 border-solid rounded-xl w-[320px] min-h-[150px] flex flex-col">
      <div className="flex items-start justify-between gap-[100px] flex-1">
        <div className="text-red-500 text-lg/6">{activity.name}</div>

        <div className="flex gap-2">
          <button
            className="p-1 rounded-lg hover:bg-[#F1F1F1] transition duration-300"
            onClick={() => editHandler(activity.id)}
          >
            <EditIcon />
          </button>
          <button
            className="p-1 rounded-lg hover:bg-[#F1F1F1] transition duration-300"
            onClick={() => deleteHandler(activity.id)}
          >
            <DeleteIcon />
          </button>
        </div>
      </div>

      {startSessionHandler && (
        <div className="flex justify-end mt-4">
          <div className="w-fit">
            <Button onClick={() => startSessionHandler(activity.id)}>
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
          <div className="font-bold">{activity.sessionsAmount}</div>
          <div className="text-[13px]">sessions</div>
        </div>
        <div className="text-center">
          <div className="font-bold">
            {getTimeHoursMinutesSeconds(activity.spentTimeSeconds)}
          </div>
          <div className="text-[13px]">spent time</div>
        </div>
      </div>
    </div>
  );
};

export default ActivityItem;
