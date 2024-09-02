import { FC, useState } from 'react';
import { clearSession } from '../helpers/authHelpers';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useAppDispatch } from '../redux/store';
import { logOutUser } from '../redux/slices/userSlice';
import { updateSession, resetSessionState } from '../redux/slices/sessionSlice';

import { resetActivityGroupState } from '../redux/slices/activityGroupSlice';
import { resetActivityState } from '../redux/slices/activitySlice';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Title from '../components/Title';

const SettingsPage: FC = () => {
  const [logoutModal, setLogoutModal] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const userInfo = useSelector((state: RootState) => state.users.user);
  const currentSession = useSelector(
    (state: RootState) => state.sessions.currentSession
  );

  const handleLogOut = async () => {
    if (currentSession) {
      await dispatch(updateSession(currentSession));

      dispatch(resetSessionState());
      dispatch(resetActivityGroupState());
      dispatch(resetActivityState());
    }
    dispatch(logOutUser());
    clearSession();
  };

  return (
    <>
      {logoutModal && (
        <Modal title="Are you sure?" onCloseModal={() => setLogoutModal(false)}>
          <div className="mb-3">Are you sure you want to log out?</div>
          <Button onClick={handleLogOut}>Yes</Button>
        </Modal>
      )}

      <div className="container mt-5">
        <Title>Settings</Title>
        <div className="my-5">
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
