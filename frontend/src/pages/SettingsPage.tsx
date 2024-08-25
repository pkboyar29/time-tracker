import { FC, useState } from 'react';
import { clearSession } from '../utils/authHelpers';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { logOutUser } from '../redux/slices/userSlice';
import {
  updateSession,
  removeCurrentSession,
} from '../redux/slices/sessionSlice';

import Button from '../components/Button';
import Modal from '../components/Modal';

const SettingsPage: FC = () => {
  const [logoutModal, setLogoutModal] = useState<boolean>(false);

  const dispatch = useDispatch<AppDispatch>();
  const userInfo = useSelector((state: RootState) => state.users.user);
  const currentSession = useSelector(
    (state: RootState) => state.sessions.currentSession
  );

  const logOutHandler = async () => {
    if (currentSession) {
      // here i should reset all state
      await dispatch(updateSession(currentSession));
      dispatch(removeCurrentSession());
    }
    dispatch(logOutUser());
    clearSession();
  };

  return (
    <>
      {logoutModal && (
        <Modal title="Are you sure?" onCloseModal={() => setLogoutModal(false)}>
          <div className="mb-3">Are you sure you want to log out?</div>
          <Button onClick={logOutHandler}>Yes</Button>
        </Modal>
      )}

      <div className="container">
        <div className="mb-5 text-xl font-bold">Settings</div>
        <div className="mb-5">
          {userInfo?.firstName} {userInfo?.lastName}
        </div>
        <Button onClick={() => setLogoutModal(true)}>
          Log out of your account
        </Button>
      </div>
    </>
  );
};

export default SettingsPage;
