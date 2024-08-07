import { FC, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from './redux/store';
import { loadSessionFromLocalStorage } from './redux/slices/sessionSlice';

import TimerPage from './pages/TimerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ActivityGroupsPage from './pages/ActivityGroupsPage';
import ActivityPage from './pages/ActivityPage';
import ActivityGroupPage from './pages/ActivityGroupPage';
import SettingsPage from './pages/SettingsPage';
import Sidebar from './components/Sidebar';

const App: FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(loadSessionFromLocalStorage());
  }, []);

  return (
    <>
      <div id="app" className="flex w-full h-full min-h-full">
        <Sidebar />

        <div className="w-full p-5">
          <Routes>
            <Route path="/timer" element={<TimerPage />} />
            <Route path="/activity-groups" element={<ActivityGroupsPage />} />
            <Route
              path="/activity-groups/:activityGroupId"
              element={<ActivityGroupPage />}
            />
            <Route
              path="/activity-groups/:activityGroupId/activities/:activityId"
              element={<ActivityPage />}
            />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<Navigate to="/timer" />} />
          </Routes>
        </div>
      </div>
    </>
  );
};

export default App;
