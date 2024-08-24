import { FC } from 'react';
import { Outlet, Navigate, RouteProps } from 'react-router-dom';
import { RootState } from '../redux/store';
import { useSelector } from 'react-redux';
import { isSession } from '../utils/authHelpers';

type ProtectedRouteProps = RouteProps & {
  requiredAuth: boolean;
};

const ProtectedRoute: FC<ProtectedRouteProps> = ({ requiredAuth }) => {
  const isLoggedOut: boolean = useSelector(
    (state: RootState) => state.users.status === 'logout'
  );
  const shouldRedirect: boolean = requiredAuth && (!isSession() || isLoggedOut);

  if (shouldRedirect) {
    return <Navigate to="/sign-in" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
