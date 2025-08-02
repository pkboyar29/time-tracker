import { FC } from 'react';
import { Outlet, Navigate, RouteProps } from 'react-router-dom';
import { useAppSelector } from '../redux/store';
import { isAuth } from '../helpers/authHelpers';

type ProtectedRouteProps = RouteProps & {
  requiredAuth: boolean;
};

const ProtectedRoute: FC<ProtectedRouteProps> = ({ requiredAuth }) => {
  const isLoggedOut: boolean = useAppSelector(
    (state) => state.users.status === 'logout'
  );
  const shouldRedirect: boolean = requiredAuth && (!isAuth() || isLoggedOut);

  if (shouldRedirect) {
    return <Navigate to="/sign-in" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
