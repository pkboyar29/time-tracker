import { FC, useEffect } from 'react';
import routeConfig from './router/routeConfig';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './router/ProtectedRoute';
import { useAppDispatch } from './redux/store';
import { loadCurrentSession } from './redux/slices/sessionSlice';
import { fetchProfileInfo } from './redux/slices/userSlice';

import Sidebar from './components/Sidebar';

const App: FC = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const nonRequiredAuthRoutes = ['/sign-in', '/sign-up', '/not-found'];
  const requiredAuth = !nonRequiredAuthRoutes.includes(location.pathname);

  useEffect(() => {
    if (requiredAuth) {
      dispatch(loadCurrentSession());
    }
  }, []);

  useEffect(() => {
    if (requiredAuth) {
      dispatch(fetchProfileInfo());
    }
  }, []);

  return (
    <>
      <div id="app" className="flex w-full h-full min-h-full">
        {requiredAuth && <Sidebar />}

        <div className="w-full">
          <Routes>
            {routeConfig.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={<ProtectedRoute requiredAuth={route.requiredAuth} />}
              >
                <Route
                  key={index}
                  path={route.path}
                  element={route.element}
                ></Route>
              </Route>
            ))}
          </Routes>
        </div>
      </div>
    </>
  );
};

export default App;
