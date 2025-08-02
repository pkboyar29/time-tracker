import { FC, useState, useEffect } from 'react';
import { clearSession } from '../../helpers/authHelpers';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { logOutUser, updateDailyGoal } from '../../redux/slices/userSlice';
import {
  updateSession,
  resetSessionState,
} from '../../redux/slices/sessionSlice';
import axios from '../../api/axios';
import { resolveAndDownloadBlob } from '../../helpers/fileHelpers';

import Button from '../Button';
import Modal from './Modal';

interface SettingsModalProps {
  onCloseModal: () => void;
}

const SettingsModal: FC<SettingsModalProps> = ({ onCloseModal }) => {
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
    <Modal title="Settings" onCloseModal={onCloseModal}>
      <div className="h-[40vh] flex flex-col gap-4 justify-between">
        <div className="flex flex-col gap-4">
          <div className="text-lg">
            {userInfo?.firstName} {userInfo?.lastName}
          </div>

          <div className="flex gap-4 text-lg">
            <div>Change your daily goal (minutes)</div>
            <input
              value={dailyGoalInput}
              onChange={inputChangeDailyGoalHandler}
              onBlur={inputBlurDailyGoalHandler}
              min={1}
              max={1440}
              type="number"
              className="w-16 bg-transparent border-b border-gray-400 border-solid"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <div>
            <Button onClick={downloadUserDataFile}>
              Export user data to file
            </Button>
          </div>

          <div>
            <Button onClick={logOutHandler}>Log out of account</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
