import { FC, useState, useRef } from 'react';
import { clearSession } from '../../helpers/authHelpers';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { logOutUser, setUser } from '../../redux/slices/userSlice';
import { updateDailyGoal, updateShowTimerInTitle } from '../../api/userApi';
import { useTimer } from '../../hooks/useTimer';
import axios from '../../api/axios';
import { resolveAndDownloadBlob } from '../../helpers/fileHelpers';
import { getReadableTimeHMS } from '../../helpers/timeHelpers';

import Button from '../common/Button';
import Modal from './Modal';
import ToggleButton from '../common/ToggleButton';
import RangeSlider from '../common/RangeSlider';
import QuestionMarkTooltip from '../common/QuestionMarkTooltip';

interface SettingsModalProps {
  onCloseModal: () => void;
}

const SettingsModal: FC<SettingsModalProps> = ({ onCloseModal }) => {
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector((state) => state.users.user);

  const { timerState, stopTimer } = useTimer();

  const [dailyGoalInput, setDailyGoalInput] = useState<number>(
    userInfo ? Math.trunc(userInfo.dailyGoal / 60) : 0
  ); // minutes
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const logOutHandler = async () => {
    if (timerState.status != 'idle') {
      await stopTimer(true);
    }
    dispatch(logOutUser());
    clearSession();
  };

  const dailyGoalInputChange = async (min: number) => {
    setDailyGoalInput(min);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const timeoutId = setTimeout(async () => {
      const newDailyGoal = min * 60;
      await updateDailyGoal(newDailyGoal);

      dispatch(setUser({ ...userInfo!, dailyGoal: newDailyGoal }));
    }, 200);
    timeoutRef.current = timeoutId;
  };

  const showTimerInTitleButtonClick = async (newState: boolean) => {
    await updateShowTimerInTitle(newState);

    dispatch(setUser({ ...userInfo!, showTimerInTitle: newState }));
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
      <div className="h-[40vh] overflow-y-auto flex flex-col gap-4 justify-between">
        <div className="flex flex-col gap-4">
          {userInfo && (
            <div className="p-5 text-center rounded-3xl bg-surfaceLightHover dark:bg-surfaceDarkDarker">
              <h3 className="mb-2 text-lg font-semibold dark:text-gray-200">
                Your daily goal
              </h3>
              <div className="mb-2 text-3xl font-bold text-primary">
                {getReadableTimeHMS(dailyGoalInput * 60)}
              </div>
              <RangeSlider
                minValue={1}
                maxValue={1440}
                currentValue={dailyGoalInput}
                changeCurrentValue={dailyGoalInputChange}
              />
            </div>
          )}

          {userInfo && (
            <div className="flex justify-between gap-4 text-lg dark:text-textDark">
              <div>Show timer in title</div>
              <ToggleButton
                isChecked={userInfo.showTimerInTitle}
                setIsChecked={showTimerInTitleButtonClick}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-4 text-lg dark:text-textDark">
            <div className="flex items-center gap-2">
              <div>Allow browser notifications</div>
              <div className="pb-3.5">
                <QuestionMarkTooltip tooltipText="Browser notifications are shown when the timer is about to end" />
              </div>
            </div>
            <ToggleButton
              isChecked={Notification.permission == 'granted'}
              setIsChecked={changeNotificationPermission}
            />
          </div>
        </div>

        <div className="flex flex-col justify-end gap-3 md:flex-row">
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
