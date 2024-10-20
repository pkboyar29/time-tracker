import { FC } from 'react';
import CustomCircularProgress from './CustomCircularProgress';

interface DailyGoalBoxProps {
  spentTimeSeconds: number;
  dailyGoalSeconds: number;
}

const DailyGoalBox: FC<DailyGoalBoxProps> = ({
  spentTimeSeconds,
  dailyGoalSeconds,
}) => {
  const dailyGoalPercent =
    (Math.trunc(spentTimeSeconds / 60) / Math.trunc(dailyGoalSeconds / 60)) *
    100;

  return (
    <div className="px-10 py-5 bg-white rounded-lg">
      <div className="flex gap-20">
        <div className="w-[140px]">
          <CustomCircularProgress
            valuePercent={dailyGoalPercent}
            label={`Daily goal: ${dailyGoalSeconds / 60}m`}
            size="verybig"
          />
        </div>
        <div className="text-xl">
          You acheived{' '}
          <span className="font-bold">
            {Math.trunc(spentTimeSeconds / 60)} minutes
          </span>
        </div>
      </div>
    </div>
  );
};

export default DailyGoalBox;
