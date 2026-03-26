import { FC, useEffect } from 'react';
import routeConfig from './router/routeConfig';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './router/ProtectedRoute';
import { useAppDispatch } from './redux/store';
import { fetchSession, updateSession } from './api/sessionApi';
import { useTimer } from './hooks/useTimer';
import { fetchProfileInfo } from './api/userApi';
import { setUser } from './redux/slices/userSlice';
import {
  getSessionFromLS,
  removeSessionFromLS,
} from './helpers/localstorageHelpers';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';
import { API_URL } from './api/axios';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import Cookies from 'js-cookie';
import { refreshAccessToken } from './helpers/authHelpers';

import { ToastContainer, toast } from 'react-toastify';
import Sidebar from './components/Sidebar';
import BurgerButton from './components/BurgerButton';
import TimerTitleUpdater from './components/TimerTitleUpdater';

const App: FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { startTimer } = useTimer();

  const location = useLocation();
  const nonRequiredAuthRoutes = ['/sign-in', '/sign-up', '/not-found'];
  const requiredAuth = !nonRequiredAuthRoutes.includes(location.pathname);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const userInfo = await fetchProfileInfo();

      dispatch(setUser(userInfo));
    };

    if (requiredAuth) {
      fetchCurrentUser();
    }
  }, []);

  useEffect(() => {
    const updateUnsyncedSession = async () => {
      const unsyncedSessionFromLS = getSessionFromLS('unsyncedSession');

      if (requiredAuth && unsyncedSessionFromLS) {
        try {
          await updateSession(unsyncedSessionFromLS);
          removeSessionFromLS('unsyncedSession');
        } catch (e) {
          if (
            e instanceof AxiosError &&
            (e.response?.status === 400 || e.response?.status === 404)
          ) {
            removeSessionFromLS('unsyncedSession');
          }
        }
      }
    };

    updateUnsyncedSession();
  }, []);

  useEffect(() => {
    const fetchCurrentSession = async () => {
      const sessionFromLS = getSessionFromLS('session');

      if (requiredAuth && sessionFromLS) {
        try {
          const sessionFromServer = await fetchSession(sessionFromLS.id);
          if (sessionFromServer.completed) {
            removeSessionFromLS('session');
            return;
          }

          startTimer(sessionFromLS, true);
          if (
            sessionFromLS.spentTimeSeconds > sessionFromServer.spentTimeSeconds
          ) {
            updateSession(sessionFromLS, true); // TODO: отображать серверные ошибки?
          }
        } catch (e) {
          if (e instanceof AxiosError && e.response?.status === 404) {
            removeSessionFromLS('session');
          } else {
            toast(t('serverErrors.getSession'), {
              type: 'error',
            });
          }
        }
      }
    };

    fetchCurrentSession();
  }, []);

  useEffect(() => {
    if (Notification.permission == 'default') {
      Notification.requestPermission();
    }
  }, []);

  // TODO: когда мы находились на странице авторизации и после авторизовались, то запроса не произойдет, в эффектах ничего нету
  useEffect(() => {
    const subscribeToServerEvents = async () => {
      if (requiredAuth) {
        await fetchEventSource(`${API_URL}/events`, {
          headers: {
            Authorization: `Bearer ${Cookies.get('access')}`,
          },
          async onopen(response) {
            if (response.ok) {
              return;
            } else if (response.status === 403) {
              throw new Error('REFRESH_REQUIRED');
            } else {
              throw new Error(`SERVER_ERROR_${response.status}`);
            }
          },
          onmessage: (event) => {
            try {
              if (event.event === 'daily_goal_completed') {
                console.log(event.event);
                console.log(event.data);
                console.log('Daily goal completed!');

                // TODO: показывать модалку
              }
            } catch (e) {
              console.error(e);
            }
          },
          onerror: (error) => {
            if (error.message === 'REFRESH_REQUIRED') {
              refreshAccessToken();

              throw error;
            }
          },
        });
      }
    };

    subscribeToServerEvents();
  }, []);

  return (
    <>
      <ToastContainer
        className="z-[200000]"
        theme={localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'}
        position="top-right"
        limit={3}
      />

      <TimerTitleUpdater />

      <div
        id="app"
        className={`relative App h-screen bg-backgroundLight dark:bg-backgroundDark ${
          requiredAuth
            ? 'min-[1340px]:grid min-[1340px]:grid-cols-[auto,1fr]'
            : ''
        }`}
      >
        {requiredAuth && (
          <>
            <BurgerButton />

            <Sidebar />
          </>
        )}

        <div className="w-full h-full overflow-y-auto">
          <Routes>
            {routeConfig.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={<ProtectedRoute requiredAuth={route.requiredAuth} />}
              >
                <Route key={index} path={route.path} element={route.element} />
              </Route>
            ))}
          </Routes>
        </div>
      </div>
    </>
  );
};

export default App;
