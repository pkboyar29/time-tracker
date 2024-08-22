import { FC, useState } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

import Button from '../components/Button';
import Modal from '../components/Modal';

const SettingsPage: FC = () => {
  const navigate = useNavigate();
  const [logoutModal, setLogoutModal] = useState<boolean>(false);

  const logOut = () => {
    Cookies.remove('access');
    Cookies.remove('refresh');

    navigate('/sign-in'); // maybe later i can remove this line of code when side effect will apear in ProtectedRoute
  };

  return (
    <>
      {logoutModal && (
        <Modal title="Are you sure?" onCloseModal={() => setLogoutModal(false)}>
          <div className="mb-3">Are you sure you want to log out?</div>
          <Button onClick={logOut}>Yes</Button>
        </Modal>
      )}

      <div className="container">
        <div className="mb-5 text-xl font-bold">Settings</div>
        <Button onClick={() => setLogoutModal(true)}>
          Log out of your account
        </Button>
      </div>
    </>
  );
};

export default SettingsPage;
