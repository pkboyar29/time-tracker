import { FC, useState } from 'react';
import CustomCircularProgress from './common/CustomCircularProgress';

import {
  getRemainingTimeHoursMinutesSeconds,
  getReadableTimeHMS,
} from '../helpers/timeHelpers';
import { ISession } from '../ts/interfaces/Session/ISession';

interface SessionProgressProps {
  session: ISession;
}

const SessionProgress: FC<SessionProgressProps> = ({ session }) => {
  const remainingLabel = getRemainingTimeHoursMinutesSeconds(
    session.totalTimeSeconds,
    session.spentTimeSeconds
  );
  const passedLabel = getReadableTimeHMS(session.spentTimeSeconds, true);

  const percent = (session.spentTimeSeconds / session.totalTimeSeconds) * 100;

  const [hovered, setHovered] = useState<boolean>(false);

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`
      transition-all duration-300 ease-out
      ${hovered ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
    `}
      >
        <CustomCircularProgress valuePercent={percent} label={remainingLabel} />
      </div>

      <div
        className={`
      transition-all duration-300 ease-out absolute inset-0
      ${hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
    `}
      >
        <CustomCircularProgress valuePercent={percent} label={passedLabel} />
      </div>
    </div>
  );
};

export default SessionProgress;
