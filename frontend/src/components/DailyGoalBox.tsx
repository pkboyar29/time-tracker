import { FC } from 'react';
import { useAppSelector } from '../redux/store';

import CustomCircularProgress from './CustomCircularProgress';

interface DailyGoalBoxProps {
  spentTimeSeconds: number;
}

const DailyGoalBox: FC<DailyGoalBoxProps> = ({ spentTimeSeconds }) => {
  const userInfo = useAppSelector((state) => state.users.user);

  const dailyGoalSeconds = userInfo!.dailyGoal;

  const dailyGoalPercent =
    spentTimeSeconds > dailyGoalSeconds
      ? 100
      : (Math.trunc(spentTimeSeconds / 60) /
          Math.trunc(dailyGoalSeconds / 60)) *
        100;

  return (
    dailyGoalSeconds && (
      <div className="px-10 py-5 bg-white border border-solid rounded-lg border-gray-300/80">
        <div className="flex flex-col items-center gap-5">
          <CustomCircularProgress
            valuePercent={dailyGoalPercent}
            label={`Daily goal: ${dailyGoalSeconds / 60}m`}
            size="verybig"
          />

          <div className="text-xl text-center">
            You acheived{' '}
            <span className="font-bold">
              {Math.trunc(spentTimeSeconds / 60)} minutes (
              {Math.trunc((spentTimeSeconds / dailyGoalSeconds) * 100)}%) /{' '}
              {Math.trunc(dailyGoalSeconds / 60)} minutes
            </span>
          </div>
        </div>
      </div>
    )
  );
};

export default DailyGoalBox;
