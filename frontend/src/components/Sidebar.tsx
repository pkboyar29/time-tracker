import { FC, useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTimer } from '../hooks/useTimer';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { setIsSidebarOpen } from '../redux/slices/windowSlice';
import { getRemainingTimeHoursMinutesSeconds } from '../helpers/timeHelpers';
import { toggleThemeInLocalStorage } from '../helpers/localstorageHelpers';
import { getWeekRange } from '../helpers/dateHelpers';

import CrossIcon from '../icons/CrossIcon';
import TimerIcon from '../icons/TimerIcon';
import BookIcon from '../icons/BookIcon';
import AnalyticsIcon from '../icons/AnalyticsIcon';
import SettingsIcon from '../icons/SettingsIcon';
import SettingsModal from './modals/SettingsModal';

const Sidebar: FC = () => {
  const dispatch = useAppDispatch();

  const [settingsModal, setSettingsModal] = useState<boolean>(false);
  const [startOfWeek, endOfWeek] = getWeekRange(new Date());

  const { timerState } = useTimer();
  const isSidebarOpen = useAppSelector((state) => state.window.isSidebarOpen);

  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutsideSidebar(e: MouseEvent) {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        dispatch(setIsSidebarOpen(false));
      }
    }

    if (isSidebarOpen) {
      window.addEventListener('click', handleClickOutsideSidebar);
    } else {
      window.removeEventListener('click', handleClickOutsideSidebar);
    }
    return () => {
      window.removeEventListener('click', handleClickOutsideSidebar);
    };
  }, [isSidebarOpen]);

  const closeSidebar = () => {
    dispatch(setIsSidebarOpen(false));
  };

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

      <div
        ref={sidebarRef}
        className={`absolute flex flex-col bg-backgroundLight dark:bg-backgroundDark h-full transition duration-300 ease-in-out z-50 top-0 left-0 xl:relative xl:translate-x-0 w-[150px] pt-2 p-5 xl:p-5 border-r border-solid border-r-gray-500 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`flex justify-end mb-3 xl:hidden`}>
          <button
            className="p-1.5 transition duration-300 hover:bg-surfaceLightHover dark:hover:bg-surfaceDarkHover rounded-full"
            onClick={() => dispatch(setIsSidebarOpen(false))}
          >
            <CrossIcon />
          </button>
        </div>

        <ul className="flex flex-col items-center justify-between flex-1">
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
              <NavLink
                onClick={closeSidebar}
                to="/timer"
                className="flex items-center gap-4 group"
              >
                <TimerIcon className="transition duration-300 group-hover:stroke-primary" />
                <div className="transition duration-300 group-hover:text-primary dark:text-textDark">
                  Timer
                </div>
              </NavLink>
            </li>

            <li>
              <NavLink
                onClick={closeSidebar}
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
                onClick={closeSidebar}
                to={`/analytics/range?from=${startOfWeek.toISOString()}&to=${endOfWeek.toISOString()}`}
                className="flex items-center gap-4 group"
              >
                <AnalyticsIcon className="transition duration-300 group-hover:stroke-primary" />
                <div className="transition duration-300 group-hover:text-primary dark:text-textDark">
                  Analytics
                </div>
              </NavLink>
            </li>
          </div>

          <li className="flex flex-col items-center mt-5">
            <button
              onClick={changeTheme}
              className="p-2 mb-8 transition duration-300 border border-transparent border-solid rounded-md hover:border-primary text-surfaceDark bg-textDark dark:bg-surfaceDark dark:text-textDark"
            >
              change theme
            </button>

            <button
              className="flex items-center gap-4 group"
              onClick={() => {
                closeSidebar();
                setSettingsModal(true);
              }}
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
