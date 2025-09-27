import { FC, useEffect } from 'react';
import routeConfig from './router/routeConfig';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './router/ProtectedRoute';
import { useAppDispatch } from './redux/store';
import { fetchSession } from './api/sessionApi';
import { setCurrentSession } from './redux/slices/sessionSlice';
import { fetchProfileInfo } from './redux/slices/userSlice';
import {
  getSessionIdFromLocalStorage,
  removeSessionFromLocalStorage,
} from './helpers/localstorageHelpers';
import { AxiosError } from 'axios';

import { ToastContainer, toast } from 'react-toastify';
import Sidebar from './components/Sidebar';

const App: FC = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const nonRequiredAuthRoutes = ['/sign-in', '/sign-up', '/not-found'];
  const requiredAuth = !nonRequiredAuthRoutes.includes(location.pathname);

  useEffect(() => {
    if (requiredAuth) {
      dispatch(fetchProfileInfo());
    }
  }, []);

  useEffect(() => {
    const fetchCurrentSession = async () => {
      const currentSessionId = getSessionIdFromLocalStorage();
      if (requiredAuth && currentSessionId) {
        try {
          const currentSession = await fetchSession(currentSessionId);
          if (!currentSession.completed) {
            dispatch(setCurrentSession(currentSession));
          }

          removeSessionFromLocalStorage();
        } catch (e) {
          if (e instanceof AxiosError && e.response?.status === 404) {
            removeSessionFromLocalStorage();
          } else {
            toast('A server error occurred while getting current session', {
              type: 'error',
            });
          }
        }
      }
    };

    fetchCurrentSession();
  }, []);

  return (
    <>
      <ToastContainer
        theme={localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'}
        position="top-right"
        limit={3}
      />

      <div
        id="app"
        className={`App h-screen bg-backgroundLight dark:bg-backgroundDark ${
          requiredAuth ? 'grid grid-cols-[auto,1fr]' : ''
        }`}
      >
        {requiredAuth && <Sidebar />}

        <div className="w-full overflow-y-auto">
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
