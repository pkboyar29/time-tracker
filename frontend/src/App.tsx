import { FC, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import TimerPage from './pages/TimerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ActivitiesPage from './pages/ActivitiesPage';
import SettingsPage from './pages/SettingsPage';
import Sidebar from './components/Sidebar';

const App: FC = () => {
  return (
    <>
      <div id="app" className="flex w-full h-full min-h-full">
        <Sidebar />

        <div className="w-full p-5">
          <Routes>
            <Route path="/timer" element={<TimerPage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
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
