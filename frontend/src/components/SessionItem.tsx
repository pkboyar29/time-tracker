import { FC } from 'react';
import { getTimeHoursMinutes } from '../helpers/timeHelpers';

import { ISession } from '../ts/interfaces/Session/ISession';

import DeleteIcon from '../icons/DeleteIcon';
import PlayIcon from '../icons/PlayIcon';
import PauseIcon from '../icons/PauseIcon';
import ResumeIcon from '../icons/ResumeIcon';
import CustomCircularProgress from './CustomCircularProgress';

interface SessionItemProps {
  isActive: boolean;
  isEnabled?: boolean;
  session: ISession;
  sessionClickHandler?: (session: ISession) => void;
  sessionDeleteHandler: (sessionId: string) => void;
}

const SessionItem: FC<SessionItemProps> = ({
  isActive,
  isEnabled,
  session,
  sessionClickHandler,
  sessionDeleteHandler,
}) => {
  return (
    <div
      className={`p-5 w-96 border border-solid rounded-xl ${
        isActive ? 'border-primary' : 'border-black dark:border-gray-500'
      }`}
    >
      <div className="flex items-start gap-20">
        <div className="flex gap-5">
          <div className="flex flex-col gap-3 ml-auto">
            <div className="flex flex-col gap-2">
              <div className="text-lg font-bold dark:text-textDark">
                Durability
              </div>
              <div className="dark:text-textDarkSecondary">
                {session.totalTimeSeconds >= 3600
                  ? getTimeHoursMinutes(session.totalTimeSeconds, true)
                  : getTimeHoursMinutes(session.totalTimeSeconds, false)}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-lg font-bold dark:text-textDark">
                Activity
              </div>
              <div className="dark:text-textDarkSecondary">
                {session.activity ? session.activity.name : 'without activity'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 ml-auto">
          <div className="flex gap-3">
            <button
              className="p-1 transition duration-300 rounded-lg hover:bg-surfaceLightHover dark:hover:bg-surfaceDarkHover"
              onClick={() => sessionClickHandler?.(session)}
            >
              {isActive ? (
                isEnabled ? (
                  <PauseIcon />
                ) : (
                  <ResumeIcon />
                )
              ) : (
                <PlayIcon />
              )}
            </button>

            <button
              className="p-1 transition duration-300 rounded-lg hover:bg-surfaceLightHover dark:hover:bg-surfaceDarkHover"
              onClick={() => sessionDeleteHandler(session.id)}
            >
              <DeleteIcon />
            </button>
          </div>

          <CustomCircularProgress
            valuePercent={
              (session.spentTimeSeconds / session.totalTimeSeconds) * 100
            }
            label={
              session.spentTimeSeconds >= 3600
                ? getTimeHoursMinutes(session.spentTimeSeconds, true)
                : `${Math.round(session.spentTimeSeconds / 60)} min`
            }
          />
        </div>
      </div>
    </div>
  );
};

export default SessionItem;
