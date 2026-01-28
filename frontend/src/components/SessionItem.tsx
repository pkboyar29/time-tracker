import { FC } from 'react';
import { getReadableTime } from '../helpers/timeHelpers';
import { useTimer } from '../hooks/useTimer';
import { useTranslation } from 'react-i18next';

import { ISession } from '../ts/interfaces/Session/ISession';

import DeleteIcon from '../icons/DeleteIcon';
import PlayIcon from '../icons/PlayIcon';
import PauseIcon from '../icons/PauseIcon';
import ResumeIcon from '../icons/ResumeIcon';
import SessionProgress from './SessionProgress';

interface SessionItemProps {
  session: ISession;
  sessionClickHandler: (session: ISession) => void;
  sessionDeleteHandler: (sessionId: string) => void;
}

const SessionItem: FC<SessionItemProps> = ({
  session,
  sessionClickHandler,
  sessionDeleteHandler,
}) => {
  const { t } = useTranslation();

  const { timerState } = useTimer();
  const isActive = timerState.session?.id === session.id;
  const isEnabled = timerState.status == 'running';

  return (
    <div
      className={`p-5 w-full min-[400px]:w-96 border border-solid rounded-xl ${
        isActive ? 'border-primary' : 'border-black dark:border-white/10'
      }`}
    >
      <div className="flex items-start justify-between gap-10 min-[400px]:gap-20">
        <div className="flex gap-5">
          <div className="flex flex-col gap-3 ml-auto">
            <div className="flex flex-col gap-2">
              <div className="text-lg font-bold dark:text-textDark">
                {t('sessionItem.duration')}
              </div>
              <div className="dark:text-textDarkSecondary">
                {getReadableTime(session.totalTimeSeconds, t, {
                  short: false,
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-lg font-bold dark:text-textDark">
                {t('sessionItem.activity')}
              </div>
              <div className="dark:text-textDarkSecondary">
                {session.activity
                  ? session.activity.name
                  : t('withoutActivity')}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex gap-2">
            <button
              title={t('sessionItem.disabledPlayButtonTitle')}
              disabled={isEnabled}
              className="p-1 transition duration-300 rounded-lg hover:bg-surfaceLightHover dark:hover:bg-surfaceDarkHover translate-y-[1px] disabled:opacity-40"
              onClick={() => sessionClickHandler(session)}
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
              title={t('sessionItem.deleteButtonTitle')}
              className="p-1 transition duration-300 rounded-lg hover:bg-surfaceLightHover dark:hover:bg-surfaceDarkHover"
              onClick={() => sessionDeleteHandler(session.id)}
            >
              <DeleteIcon />
            </button>
          </div>

          <SessionProgress session={session} />
        </div>
      </div>
    </div>
  );
};

export default SessionItem;
