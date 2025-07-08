import { RouteObject, Navigate } from 'react-router-dom';

import TimerPage from '../pages/TimerPage';
import AnalyticsOverallPage from '../pages/AnalyticsOverallPage';
import ActivityGroupsPage from '../pages/ActivityGroupsPage';
import ActivityPage from '../pages/ActivityPage';
import ActivityGroupPage from '../pages/ActivityGroupPage';
import SignInPage from '../pages/SignInPage';
import SignUpPage from '../pages/SignUpPage';
import NotFoundPage from '../pages/NotFoundPage';
import AnalyticsRangePage from '../pages/AnalyticsRangePage';

type RouteType = RouteObject & {
  requiredAuth: boolean;
};

const routeConfig: RouteType[] = [
  {
    path: '/timer',
    element: <TimerPage />,
    requiredAuth: true,
  },
  {
    path: '/activity-groups',
    element: <ActivityGroupsPage />,
    requiredAuth: true,
  },
  {
    path: '/activity-groups/:activityGroupId',
    element: <ActivityGroupPage />,
    requiredAuth: true,
  },
  {
    path: '/activity-groups/:activityGroupId/activities/:activityId',
    element: <ActivityPage />,
    requiredAuth: true,
  },
  {
    path: '/analytics',
    element: <AnalyticsOverallPage />,
    requiredAuth: true,
  },
  {
    path: '/analytics/range',
    element: <AnalyticsRangePage />,
    requiredAuth: true,
  },
  // {
  //   path: '/settings',
  //   element: <SettingsPage />,
  //   requiredAuth: true,
  // },
  {
    path: '/sign-in',
    element: <SignInPage />,
    requiredAuth: false,
  },
  {
    path: '/sign-up',
    element: <SignUpPage />,
    requiredAuth: false,
  },
  {
    path: '/not-found',
    element: <NotFoundPage />,
    requiredAuth: false,
  },
  {
    path: '/',
    element: <Navigate to="/sign-in" />,
    requiredAuth: false,
  },
  {
    path: '*',
    element: <Navigate to="/not-found" />,
    requiredAuth: false,
  },
];

export default routeConfig;
