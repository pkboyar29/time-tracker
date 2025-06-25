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
    <div className="flex justify-center gap-20 px-10 py-5 bg-white border border-solid rounded-lg border-gray-300/80">
      <div className="text-center">
        <div className="text-xl font-bold">
          {getTimeHoursMinutes(statistics.spentTimeSeconds)}
        </div>
        <div className="text-lg font-bold text-gray-500 uppercase">
          total time
        </div>
      </div>

      <div className="text-center">
        <div className="text-xl font-bold">{statistics.sessionsAmount}</div>
        <div className="text-lg font-bold text-gray-500 uppercase">
          total sessions
        </div>
      </div>
    </div>
  );
};

export default SessionStatisticsBox;
