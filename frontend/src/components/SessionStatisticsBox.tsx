import { FC } from 'react';
import { ISessionStatistics } from '../ts/interfaces/Statistics/ISessionStatistics';
import { getTimeHoursMinutes } from '../helpers/timeHelpers';

interface SessionStatisticsBoxProps {
  statistics: ISessionStatistics;
}

const SessionStatisticsBox: FC<SessionStatisticsBoxProps> = ({
  statistics,
}) => {
  return (
    <div className="flex justify-center gap-20 px-10 py-5 border border-solid rounded-lg bg-surfaceLight dark:bg-surfaceDark border-gray-300/80 dark:border-gray-500">
      <div className="text-center">
        <div className="text-xl font-bold dark:text-textDark">
          {getTimeHoursMinutes(statistics.spentTimeSeconds)}
        </div>
        <div className="text-lg font-bold text-gray-500 uppercase dark:text-textDarkSecondary">
          total time
        </div>
      </div>

      <div className="text-center">
        <div className="text-xl font-bold dark:text-textDark">
          {statistics.sessionsAmount}
        </div>
        <div className="text-lg font-bold text-gray-500 uppercase dark:text-textDarkSecondary">
          total sessions
        </div>
      </div>
    </div>
  );
};

export default SessionStatisticsBox;
