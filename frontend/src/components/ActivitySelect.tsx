import { FC } from 'react';
import { IActivity } from '../ts/interfaces/Activity/IActivity';

interface ActivitySelectProps {
  topActivities: IActivity[];
  remainingActivities: IActivity[];
  value: string;
  onChange: (id: string) => void;
}

const ActivitySelect: FC<ActivitySelectProps> = ({
  topActivities,
  remainingActivities,
  value,
  onChange,
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg dark:text-textDark dark:bg-surfaceDarkHover dark:border-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="" className="italic text-gray-500">
        Without activity
      </option>

      {topActivities.length > 0 && (
        <optgroup
          label="Last activities ⭐"
          className="text-sm font-semibold text-primary"
        >
          {topActivities.map((activity) => (
            <option key={activity.id} value={activity.id} className="text-base">
              {activity.name}
            </option>
          ))}
        </optgroup>
      )}

      <optgroup label="All activities" className="text-sm font-semibold ">
        {remainingActivities.map((activity) => (
          <option key={activity.id} value={activity.id} className="text-base">
            {activity.name}
          </option>
        ))}
      </optgroup>
    </select>
  );
};

export default ActivitySelect;
