import { FC, useState, useEffect } from 'react';
import { clearSession } from '../../helpers/authHelpers';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import {
  logOutUser,
  updateDailyGoal,
  updateShowTimerInTitle,
} from '../../redux/slices/userSlice';
import { resetSessionState } from '../../redux/slices/sessionSlice';
import { updateSession } from '../../api/sessionApi';
import axios from '../../api/axios';
import { resolveAndDownloadBlob } from '../../helpers/fileHelpers';

import Button from '../Button';
import Modal from './Modal';
import ToggleButton from '../ToggleButton';

interface SettingsModalProps {
  onCloseModal: () => void;
}

const SettingsModal: FC<SettingsModalProps> = ({ onCloseModal }) => {
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector((state) => state.users.user);
  const currentSession = useAppSelector(
    (state) => state.sessions.currentSession
  );

  const [dailyGoalInput, setDailyGoalInput] = useState<number>(0);

  useEffect(() => {
    if (userInfo) {
      setDailyGoalInput(Math.trunc(userInfo.dailyGoal / 60));
    }
  }, [userInfo]);

  const logOutHandler = async () => {
    if (currentSession) {
      await updateSession(currentSession);

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

  const showTimerInTitleButtonClick = async (newState: boolean) => {
    dispatch(updateShowTimerInTitle(newState));
  };

  const changeNotificationPermission = () => {
    if (Notification.permission == 'default') {
      Notification.requestPermission();
    } else if (Notification.permission == 'denied') {
      alert(
        'You have blocked notifications. Please enable them manually in your browser settings.'
      );
    } else if (Notification.permission == 'granted') {
      alert(
        'If you want to block notifications, do it manually in your browser settings.'
      );
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
          <div className="text-lg dark:text-textDark">
            {userInfo?.firstName} {userInfo?.lastName}
          </div>

          <div className="flex gap-4 text-lg dark:text-textDark">
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

          {userInfo && (
            <div className="flex justify-between gap-4 text-lg dark:text-textDark">
              <div>Show timer in title</div>
              <ToggleButton
                isChecked={userInfo.showTimerInTitle}
                setIsChecked={showTimerInTitleButtonClick}
              />
            </div>
          )}

          <div className="flex justify-between gap-4 text-lg dark:text-textDark">
            <div>Allow browser notifications</div>
            <ToggleButton
              isChecked={Notification.permission == 'granted'}
              setIsChecked={changeNotificationPermission}
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
