import { FC } from 'react';

import { ISession } from '../ts/interfaces/Session/ISession';
import CustomCircularProgress from './CustomCircularProgress';

interface SessionItemProps {
  isActive: boolean;
  isEnabled?: boolean;
  session: ISession;
  sessionClickHandler?: (sessionId: string) => void;
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
            <button onClick={() => sessionClickHandler?.(session.id)}>
              {isActive ? (
                isEnabled ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 7.5V18M15 7.5V18M3 16.811V8.69c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811Z"
                    />
                  </svg>
                )
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                  />
                </svg>
              )}
            </button>
            <button onClick={() => sessionDeleteHandler(session.id)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </button>
          </div>
          <CustomCircularProgress
            value={(session.spentTimeSeconds / session.totalTimeSeconds) * 100}
            label={`${Math.round(session.spentTimeSeconds / 60)} min`}
          />
        </div>
      </div>
    </div>
  );
};

export default SessionItem;
