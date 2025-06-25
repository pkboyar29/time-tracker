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
    spentTimeSeconds > dailyGoalSeconds
      ? 100
      : (Math.trunc(spentTimeSeconds / 60) /
          Math.trunc(dailyGoalSeconds / 60)) *
        100;

  return (
    <div className="px-10 py-5 bg-white border border-solid rounded-lg border-gray-300/80">
      <div className="flex items-center gap-10">
        <CustomCircularProgress
          valuePercent={dailyGoalPercent}
          label={`Daily goal: ${dailyGoalSeconds / 60}m`}
          size="verybig"
        />
        <div className="text-xl">
          You acheived{' '}
          <span className="font-bold">
            {Math.trunc(spentTimeSeconds / 60)} minutes (
            {Math.trunc((spentTimeSeconds / dailyGoalSeconds) * 100)}%) /{' '}
            {Math.trunc(dailyGoalSeconds / 60)} minutes
          </span>
        </div>
      </div>
    </div>
  );
};

export default DailyGoalBox;
