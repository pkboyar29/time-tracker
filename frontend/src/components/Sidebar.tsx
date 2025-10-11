import { FC, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTimer } from '../hooks/useTimer';
import { getRemainingTimeHoursMinutesSeconds } from '../helpers/timeHelpers';
import { toggleThemeInLocalStorage } from '../helpers/localstorageHelpers';

import TimerIcon from '../icons/TimerIcon';
import BookIcon from '../icons/BookIcon';
import AnalyticsIcon from '../icons/AnalyticsIcon';
import SettingsIcon from '../icons/SettingsIcon';
import SettingsModal from './modals/SettingsModal';

const Sidebar: FC = () => {
  const [settingsModal, setSettingsModal] = useState<boolean>(false);

  const { timerState } = useTimer();

  const changeTheme = () => {
    const newTheme = toggleThemeInLocalStorage();
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <>
      {settingsModal && (
        <SettingsModal onCloseModal={() => setSettingsModal(false)} />
      )}

      <div className="w-[150px] p-5 border-r border-solid border-r-gray-500">
        <ul className="flex flex-col items-center justify-between h-full">
          <div className="flex flex-col items-center gap-5">
            <li className="flex flex-col items-center min-h-[32px]">
              {timerState.status != 'idle' && (
                <div className="px-4 py-2 text-sm shadow-sm rounded-xl bg-primary/10 text-primary dark:bg-surfaceDark dark:text-textDark">
                  {getRemainingTimeHoursMinutesSeconds(
                    timerState.session.totalTimeSeconds,
                    timerState.session.spentTimeSeconds
                  )}
                </div>
              )}
            </li>

            <li>
              <NavLink to="/timer" className="flex items-center gap-4 group">
                <TimerIcon className="transition duration-300 group-hover:stroke-primary" />
                <div className="transition duration-300 group-hover:text-primary dark:text-textDark">
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
                <div className="transition duration-300 group-hover:text-primary dark:text-textDark">
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
                <div className="transition duration-300 group-hover:text-primary dark:text-textDark">
                  Analytics
                </div>
              </NavLink>
            </li>
          </div>

          <li>
            <button
              onClick={changeTheme}
              className="p-2 mb-8 transition duration-300 border border-transparent border-solid rounded-md hover:border-primary text-surfaceDark bg-textDark dark:bg-surfaceDark dark:text-textDark"
            >
              change theme
            </button>

            <button
              className="flex items-center gap-4 group"
              onClick={() => setSettingsModal(true)}
            >
              <SettingsIcon className="transition duration-300 group-hover:stroke-primary" />
              <div className="transition duration-300 group-hover:text-primary dark:text-textDark">
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
