import { FC } from 'react';
import { ISessionStatistics } from '../ts/interfaces/Statistics/ISessionStatistics';
import { getReadableTimeHMS } from '../helpers/timeHelpers';

import QuestionMarkTooltip from './common/QuestionMarkTooltip';

interface SessionStatisticsBoxProps {
  statistics: ISessionStatistics;
}

const SessionStatisticsBox: FC<SessionStatisticsBoxProps> = ({
  statistics,
}) => {
  return (
    <div className="flex flex-wrap justify-center gap-5 px-10 py-5 border border-solid rounded-lg md:gap-10 2xl:gap-20 bg-surfaceLight dark:bg-surfaceDark border-gray-300/80 dark:border-gray-500">
      <div className="text-center">
        <div className="text-xl font-bold dark:text-textDark">
          {getReadableTimeHMS(statistics.spentTimeSeconds)}
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

      <div className="text-center">
        <div className="text-xl font-bold dark:text-textDark">
          {statistics.pausedAmount} times
        </div>
        <div className="relative">
          <div className="text-lg font-bold text-gray-500 uppercase dark:text-textDarkSecondary">
            distracted
          </div>

          <div className="absolute pl-2 -top-0.5 left-full">
            <QuestionMarkTooltip tooltipText="Number of times you pressed pause during the session" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionStatisticsBox;
