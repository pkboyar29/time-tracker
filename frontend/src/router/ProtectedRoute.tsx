import { FC } from 'react';
import { Outlet, Navigate, RouteProps } from 'react-router-dom';
import { RootState } from '../redux/store';
import { useSelector } from 'react-redux';
import { isAuth } from '../helpers/authHelpers';

type ProtectedRouteProps = RouteProps & {
  requiredAuth: boolean;
};

const ProtectedRoute: FC<ProtectedRouteProps> = ({ requiredAuth }) => {
  const isLoggedOut: boolean = useSelector(
    (state: RootState) => state.users.status === 'logout'
  );
  const shouldRedirect: boolean = requiredAuth && (!isAuth() || isLoggedOut);

  if (shouldRedirect) {
    return <Navigate to="/sign-in" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
