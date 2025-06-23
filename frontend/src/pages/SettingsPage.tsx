import { FC, useState, useEffect } from 'react';
import { clearSession } from '../helpers/authHelpers';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { logOutUser, updateDailyGoal } from '../redux/slices/userSlice';
import { updateSession, resetSessionState } from '../redux/slices/sessionSlice';
import axios from '../axios';
import { resolveAndDownloadBlob } from '../helpers/fileHelpers';

import Button from '../components/Button';
import Title from '../components/Title';

const SettingsPage: FC = () => {
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

  const downloadUserDataFile = async () => {
    const response = await axios.get(`/users/export`, {
      responseType: 'blob',
    });
    const contentDisposition: string = response.headers['content-disposition'];

    resolveAndDownloadBlob(
      response,
      contentDisposition.substring(22, contentDisposition.length - 1)
    );
  };

  return (
    <>
      <div className="container py-5">
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
        <div className="flex gap-4">
          <div>
            <Button onClick={downloadUserDataFile}>
              Export user data to file
            </Button>
          </div>

          <div>
            <Button onClick={logOutHandler}>Log out of your account</Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
