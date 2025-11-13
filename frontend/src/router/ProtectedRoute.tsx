import { FC } from 'react';
import { Outlet, Navigate, RouteProps } from 'react-router-dom';
import { isAuth } from '../helpers/authHelpers';

type ProtectedRouteProps = RouteProps & {
  requiredAuth: boolean;
};

const ProtectedRoute: FC<ProtectedRouteProps> = ({ requiredAuth }) => {
  const shouldRedirect: boolean = requiredAuth && !isAuth();

  if (shouldRedirect) {
    return <Navigate to="/sign-in" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
