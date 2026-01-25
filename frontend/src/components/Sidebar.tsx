import { FC, useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTimerWithSeconds } from '../hooks/useTimer';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { setIsSidebarOpen } from '../redux/slices/windowSlice';
import { getRemainingTimeHoursMinutesSeconds } from '../helpers/timeHelpers';
import { toggleThemeInLS } from '../helpers/localstorageHelpers';
import { getWeekRange } from '../helpers/dateHelpers';
import { useTranslation } from 'react-i18next';

import CrossIcon from '../icons/CrossIcon';
import TimerIcon from '../icons/TimerIcon';
import BookIcon from '../icons/BookIcon';
import AnalyticsIcon from '../icons/AnalyticsIcon';
import SettingsIcon from '../icons/SettingsIcon';
import SettingsModal from './settings/SettingsModal';

const Sidebar: FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [settingsModal, setSettingsModal] = useState<boolean>(false);
  const [startOfWeek, endOfWeek] = getWeekRange(new Date());

  const { timerState } = useTimerWithSeconds();

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
    const newTheme = toggleThemeInLS();
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

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 xl:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        ref={sidebarRef}
        className={`absolute flex flex-col bg-backgroundLight dark:bg-backgroundDark h-full transition duration-300 ease-in-out z-50 top-0 left-0 xl:relative xl:translate-x-0 w-[200px] sm:w-[170px] pt-2 p-5 xl:p-5 border-r border-solid border-r-gray-500 ${
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
              {timerState.status !== 'idle' && (
                <div className="px-4 py-2 text-sm shadow-sm rounded-xl bg-primary/10 text-primary dark:bg-surfaceDark dark:text-textDark">
                  {getRemainingTimeHoursMinutesSeconds(
                    timerState.session.totalTimeSeconds,
                    timerState.session.spentTimeSeconds,
                  )}
                </div>
              )}
            </li>

            <li className="w-full">
              <NavLink
                onClick={closeSidebar}
                to="/timer"
                className={({ isActive }) =>
                  `flex items-center gap-5 w-full px-4 py-2 rounded-xl transition duration-200
       ${isActive ? 'bg-primary/10 dark:bg-surfaceDarkHover shadow-inner' : ''}
    hover:bg-primary/10 dark:hover:bg-surfaceDarkHover`
                }
              >
                <TimerIcon />
                <div className="dark:text-textDark">{t('sidebar.timer')}</div>
              </NavLink>
            </li>

            <li className="w-full">
              <NavLink
                onClick={closeSidebar}
                to="/activity-groups"
                className={({ isActive }) =>
                  `flex items-center gap-5 w-full px-4 py-2 rounded-xl transition duration-200
       ${isActive ? 'bg-primary/10 dark:bg-surfaceDarkHover shadow-inner' : ''}
       hover:bg-primary/10 dark:hover:bg-surfaceDarkHover`
                }
              >
                <BookIcon />
                <div className="dark:text-textDark">
                  {t('sidebar.activities')}
                </div>
              </NavLink>
            </li>

            <li className="w-full">
              <NavLink
                onClick={closeSidebar}
                to={`/analytics/range?from=${startOfWeek.toISOString()}&to=${endOfWeek.toISOString()}`}
                className={({ isActive }) =>
                  `flex items-center gap-5 w-full px-4 py-2 rounded-xl transition duration-200
       ${isActive ? 'bg-primary/10 dark:bg-surfaceDarkHover shadow-inner' : ''}
       hover:bg-primary/10 dark:hover:bg-surfaceDarkHover`
                }
              >
                <AnalyticsIcon />
                <div className="dark:text-textDark">
                  {t('sidebar.analytics')}
                </div>
              </NavLink>
            </li>
          </div>

          <li className="flex flex-col items-center w-full mt-5">
            <button
              onClick={changeTheme}
              className="p-2 mb-8 transition duration-300 border border-transparent border-solid rounded-md hover:border-primary text-surfaceDark bg-textDark dark:bg-surfaceDark dark:text-textDark"
            >
              {t('sidebar.changeTheme')}
            </button>

            <button
              className="flex items-center gap-5 px-3 py-2 transition duration-200 sm:w-full rounded-xl hover:bg-primary/10 dark:hover:bg-surfaceDarkHover"
              onClick={() => {
                closeSidebar();
                setSettingsModal(true);
              }}
            >
              <SettingsIcon />
              <div className="dark:text-textDark">{t('sidebar.settings')}</div>
            </button>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
