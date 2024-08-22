import { FC } from 'react';
import { Outlet, Navigate, RouteProps } from 'react-router-dom';
import Cookies from 'js-cookie';

type ProtectedRouteProps = RouteProps & {
  requiredAuth: boolean;
};

const ProtectedRoute: FC<ProtectedRouteProps> = ({ requiredAuth }) => {
  // useEffect(() => {

  // }, [Cookies.get('refresh')]);
  // quite better when i have global state of user and use useEffect on this state?

  if (requiredAuth && Cookies.get('refresh') === undefined) {
    return <Navigate to="/sign-in" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
