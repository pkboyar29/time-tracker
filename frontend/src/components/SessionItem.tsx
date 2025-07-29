import { FC } from 'react';

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
        isActive ? 'border-red-500' : 'border-black'
      }`}
    >
      <div className="flex items-start gap-20">
        <div className="flex gap-5">
          <div className="flex flex-col gap-3 ml-auto">
            <div className="flex flex-col gap-2">
              <div className="text-lg font-bold">Durability</div>
              <div>{session.totalTimeSeconds / 60} min</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-lg font-bold">Activity</div>
              <div>
                {session.activity ? session.activity.name : 'without activity'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 ml-auto">
          <div className="flex gap-3">
            <button onClick={() => sessionClickHandler?.(session)}>
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

            <button onClick={() => sessionDeleteHandler(session.id)}>
              <DeleteIcon />
            </button>
          </div>

          <CustomCircularProgress
            valuePercent={
              (session.spentTimeSeconds / session.totalTimeSeconds) * 100
            }
            label={`${Math.round(session.spentTimeSeconds / 60)} min`}
          />
        </div>
      </div>
    </div>
  );
};

export default SessionItem;
