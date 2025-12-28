import { FC } from 'react';
import { useAppSelector } from '../redux/store';
import { getReadableTime } from '../helpers/timeHelpers';
import { useTranslation } from 'react-i18next';

import CustomCircularProgress from './common/CustomCircularProgress';

interface DailyGoalBoxProps {
  spentTimeSeconds: number;
}

const DailyGoalBox: FC<DailyGoalBoxProps> = ({ spentTimeSeconds }) => {
  const { t } = useTranslation();
  const userInfo = useAppSelector((state) => state.users.user);

  const dailyGoalSeconds = userInfo?.dailyGoal ?? 0;
  const dailyGoalPercent =
    spentTimeSeconds > dailyGoalSeconds
      ? 100
      : (Math.trunc(spentTimeSeconds / 60) /
          Math.trunc(dailyGoalSeconds / 60)) *
        100;

  return (
    dailyGoalSeconds && (
      <div className="px-10 py-5 bg-white border border-solid rounded-lg dark:bg-surfaceDark border-gray-300/80 dark:border-gray-500">
        <div className="flex flex-col items-center gap-5">
          <CustomCircularProgress
            valuePercent={dailyGoalPercent}
            label={`${t('dailyGoalBox.title')}: ${getReadableTime(
              dailyGoalSeconds,
              t,
              {
                short: true,
              }
            )}`}
            size="big"
          />

          <div className="text-center tex-lg md:text-xl dark:text-textDark">
            {t('dailyGoalBox.youAchieved')}:{' '}
            <span className="font-bold">
              {getReadableTime(spentTimeSeconds, t, {
                short: false,
              })}{' '}
              ({Math.trunc((spentTimeSeconds / dailyGoalSeconds) * 100)}%)
            </span>
          </div>
        </div>
      </div>
    )
  );
};

export default DailyGoalBox;
