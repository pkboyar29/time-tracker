import { FC, useState, useEffect } from 'react';
import { clearSession } from '../helpers/authHelpers';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { logOutUser, updateDailyGoal } from '../redux/slices/userSlice';
import { updateSession, resetSessionState } from '../redux/slices/sessionSlice';

import Button from '../components/Button';
import Modal from '../components/modals/Modal';
import Title from '../components/Title';

const SettingsPage: FC = () => {
  const [logoutModal, setLogoutModal] = useState<boolean>(false);
  const [dailyGoalInput, setDailyGoalInput] = useState<number>(0);

  const dispatch = useAppDispatch();
  const userInfo = useAppSelector((state) => state.users.user);
  const currentSession = useAppSelector(
    (state) => state.sessions.currentSession
  );

  useEffect(() => {
    if (userInfo) {
      setDailyGoalInput(Math.trunc(userInfo.dailyGoal / 60));
    }
  }, [userInfo]);

  const logOutHandler = async () => {
    if (currentSession) {
      await dispatch(updateSession(currentSession));

      dispatch(resetSessionState());
    }
    dispatch(logOutUser());
    clearSession();
  };

  const inputChangeDailyGoalHandler = async (
    e: React.FormEvent<HTMLInputElement>
  ) => {
    setDailyGoalInput(parseInt(e.currentTarget.value));
  };

  const inputBlurDailyGoalHandler = async () => {
    if (!Number.isNaN(dailyGoalInput)) {
      dispatch(updateDailyGoal(dailyGoalInput * 60));
    }
  };

  return (
    <>
      {logoutModal && (
        <Modal title="Are you sure?" onCloseModal={() => setLogoutModal(false)}>
          <div className="mb-3">Are you sure you want to log out?</div>
          <Button onClick={logOutHandler}>Yes</Button>
        </Modal>
      )}

      <div className="container mt-5">
        <Title>Settings</Title>
        <div className="my-5 text-lg">
          {userInfo?.firstName} {userInfo?.lastName}
        </div>
        <div className="flex gap-4 my-5 text-lg">
          <div>Change your daily goal (minutes)</div>
          <input
            value={dailyGoalInput}
            onChange={inputChangeDailyGoalHandler}
            onBlur={inputBlurDailyGoalHandler}
            type="number"
            className="w-16 border-b border-gray-400 border-solid"
          />
        </div>
        <div className="inline-block">
          <Button onClick={() => setLogoutModal(true)}>
            Log out of your account
          </Button>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
