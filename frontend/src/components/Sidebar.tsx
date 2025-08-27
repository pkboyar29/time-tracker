import { FC, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppSelector } from '../redux/store';
import { getRemainingTimeHoursMinutesSeconds } from '../helpers/timeHelpers';

import TimerIcon from '../icons/TimerIcon';
import BookIcon from '../icons/BookIcon';
import AnalyticsIcon from '../icons/AnalyticsIcon';
import SettingsIcon from '../icons/SettingsIcon';
import SettingsModal from './modals/SettingsModal';

const Sidebar: FC = () => {
  const [settingsModal, setSettingsModal] = useState<boolean>(false);

  const currentSession = useAppSelector(
    (state) => state.sessions.currentSession
  );

  return (
    <>
      {settingsModal && (
        <SettingsModal onCloseModal={() => setSettingsModal(false)} />
      )}

      <div className="w-[150px] p-5 border-r border-solid border-r-gray-500">
        <ul className="flex flex-col items-center justify-between h-full">
          <div className="flex flex-col items-center gap-5">
            <li className="flex flex-col items-center gap-2">
              {currentSession && (
                <>
                  {getRemainingTimeHoursMinutesSeconds(
                    currentSession.totalTimeSeconds,
                    currentSession.spentTimeSeconds
                  )}
                </>
              )}
              <NavLink
                to="/timer"
                className="flex items-center gap-4 pt-4 group"
              >
                <TimerIcon className="transition duration-300 group-hover:stroke-primary" />
                <div className="transition duration-300 group-hover:text-primary">
                  Timer
                </div>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/activity-groups"
                className="flex items-center gap-4 group"
              >
                <BookIcon className="transition duration-300 group-hover:stroke-primary" />
                <div className="transition duration-300 group-hover:text-primary">
                  Activities
                </div>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/analytics"
                className="flex items-center gap-4 group"
              >
                <AnalyticsIcon className="transition duration-300 group-hover:stroke-primary" />
                <div className="transition duration-300 group-hover:text-primary">
                  Analytics
                </div>
              </NavLink>
            </li>
          </div>

          <li>
            <button
              className="flex items-center gap-4 group"
              onClick={() => setSettingsModal(true)}
            >
              <SettingsIcon className="transition duration-300 group-hover:stroke-primary" />
              <div className="transition duration-300 group-hover:text-primary">
                Settings
              </div>
            </button>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
