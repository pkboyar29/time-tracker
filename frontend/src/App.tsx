import { FC, useEffect } from 'react';
import routeConfig from './router/routeConfig';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './router/ProtectedRoute';
import { useDispatch } from 'react-redux';
import { AppDispatch } from './redux/store';
import { loadSessionFromLocalStorage } from './redux/slices/sessionSlice';

import Sidebar from './components/Sidebar';

const App: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(loadSessionFromLocalStorage());
  }, []);

  const location = useLocation();
  const hideSidebarRoutes = ['/sign-in', '/sign-up'];
  const shouldShowSidebar = !hideSidebarRoutes.includes(location.pathname);

  return (
    <>
      <div id="app" className="flex w-full h-full min-h-full">
        {shouldShowSidebar && <Sidebar />}

        <div className="w-full p-5">
          <Routes>
            {routeConfig.map((route) => (
              <Route
                key={route.id}
                path={route.path}
                element={<ProtectedRoute requiredAuth={route.requiredAuth} />}
              >
                <Route path={route.path} element={route.element}></Route>
              </Route>
            ))}
          </Routes>
        </div>
      </div>
    </>
  );
};

export default App;
