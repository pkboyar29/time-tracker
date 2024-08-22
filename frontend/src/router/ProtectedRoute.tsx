import { FC } from 'react';
import { Outlet, Navigate, Route, RouteProps } from 'react-router-dom';
import Cookies from 'js-cookie';

type ProtectedRouteProps = RouteProps & {
  requiredAuth: boolean;
};

const ProtectedRoute: FC<ProtectedRouteProps> = ({ requiredAuth }) => {
  if (requiredAuth && Cookies.get('refresh') === undefined) {
    return <Navigate to="/sign-in" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
