import { FC } from 'react';
import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';
import { getTimeMinutes } from '../helpers/timeHelpers';

interface ActivityDistributionBoxProps {
  activityDistributionItems: IActivityDistribution[];
}

const ActivityDistributionBox: FC<ActivityDistributionBoxProps> = ({
  activityDistributionItems: activityDistribution,
}) => {
  return (
    <div className="h-full px-10 py-5 overflow-y-auto bg-white border border-solid rounded-lg border-gray-300/80">
      <div className="flex justify-end">
        <div className="inline-block px-4 py-1 mb-4 ml-auto mr-0 text-lg font-medium tracking-wide text-right text-gray-800 bg-gray-300 rounded-lg">
          Activity distribution
        </div>
      </div>
      <div className="flex mb-3 text-lg tracking-wide text-gray-800">
        <div className="w-1/2">Activity</div>
        <div className="w-1/5">Sessions</div>
        <div className="w-1/5">Time</div>
        <div className="w-1/5">Ratio</div>
      </div>
      <div className="flex flex-col gap-3">
        {activityDistribution
          .toSorted((a, b) => b.spentTimeSeconds - a.spentTimeSeconds)
          .map((activityDistributionItem, index) => (
            <div className="flex items-center text-base" key={index}>
              <div className="w-1/2 text-lg font-bold">
                {activityDistributionItem.activityName}
              </div>
              <div className="w-1/5">
                {activityDistributionItem.sessionsAmount}
              </div>
              <div className="w-1/5">
                {getTimeMinutes(activityDistributionItem.spentTimeSeconds)}m
              </div>
              <div className="w-1/5">
                {Math.trunc(activityDistributionItem.spentTimePercentage * 100)}
                %
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ActivityDistributionBox;
