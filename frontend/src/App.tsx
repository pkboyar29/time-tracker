import { FC, useEffect } from 'react';
import routeConfig from './router/routeConfig';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './router/ProtectedRoute';
import { useAppDispatch } from './redux/store';
import { loadCurrentSession } from './redux/slices/sessionSlice';
import { fetchProfileInfo } from './redux/slices/userSlice';
import { getSessionIdFromLocalStorage } from './helpers/localstorageHelpers';

import { ToastContainer } from 'react-toastify';
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
    const currentSessionId = getSessionIdFromLocalStorage();
    if (requiredAuth && currentSessionId) {
      dispatch(loadCurrentSession(currentSessionId));
    }
  }, []);

  return (
    <>
      <ToastContainer position="top-right" limit={3} />

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
