import { FC, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { logOutUser, setUser } from '../../redux/slices/userSlice';
import { updateDailyGoal, updateShowTimerInTitle } from '../../api/userApi';
import { useTimer } from '../../hooks/useTimer';
import axios from '../../api/axios';
import { useTranslation } from 'react-i18next';
import { clearSession } from '../../helpers/authHelpers';
import { resolveAndDownloadBlob } from '../../helpers/fileHelpers';
import { getReadableTime } from '../../helpers/timeHelpers';
import { setLangInLS } from '../../helpers/localstorageHelpers';

import PrimaryClipLoader from '../common/PrimaryClipLoader';
import RangeSlider from '../common/RangeSlider';
import CustomSelect from '../common/CustomSelect';
import ToggleButton from '../common/ToggleButton';
import QuestionMarkTooltip from '../common/QuestionMarkTooltip';
import Button from '../common/Button';

const SettingsGeneralSection: FC = () => {
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector((state) => state.users.user);

  if (!userInfo) {
    return (
      <div className="pb-5 text-center">
        <PrimaryClipLoader />
      </div>
    );
  }

  const { t, i18n } = useTranslation();

  const { timerState, stopTimer } = useTimer();

  const [dailyGoalInput, setDailyGoalInput] = useState<number>(
    Math.trunc(userInfo.dailyGoal / 60),
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

      dispatch(setUser({ ...userInfo, dailyGoal: newDailyGoal }));
    }, 200);
    timeoutRef.current = timeoutId;
  };

  const showTimerInTitleButtonClick = async (newState: boolean) => {
    await updateShowTimerInTitle(newState);

    dispatch(setUser({ ...userInfo, showTimerInTitle: newState }));
  };

  const changeNotificationPermission = () => {
    if (Notification.permission == 'default') {
      Notification.requestPermission();
    } else if (Notification.permission == 'denied') {
      alert(t('notifications.blocked'));
    } else if (Notification.permission == 'granted') {
      alert(t('notifications.wantToBlock'));
    }
  };

  const downloadUserDataFile = async () => {
    const response = await axios.get(`/users/export`, {
      responseType: 'blob',
    });
    const contentDisposition: string = response.headers['content-disposition'];

    resolveAndDownloadBlob(
      response,
      contentDisposition.substring(22, contentDisposition.length - 1),
    );
  };

  const onLangSelectChange = (lang: string) => {
    setLangInLS(lang as 'ru' | 'en');
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex flex-col justify-between h-full gap-4">
      <div className="flex flex-col gap-4">
        <div className="p-5 text-center rounded-3xl bg-surfaceLightHover dark:bg-surfaceDarkDarker">
          <h3 className="mb-2 text-lg font-semibold dark:text-gray-200">
            {t('settingsModal.dailyGoal')}
          </h3>
          <div className="mb-2 text-xl font-bold sm:text-3xl text-primary">
            {getReadableTime(dailyGoalInput * 60, t, {
              short: false,
              zeroUnits: true,
            })}
          </div>
          <RangeSlider
            minValue={1}
            maxValue={1440}
            currentValue={dailyGoalInput}
            changeCurrentValue={dailyGoalInputChange}
          />
        </div>

        <div className="flex justify-between gap-4 text-base sm:text-lg dark:text-textDark">
          <div>{t('settingsModal.timerInTitle')}</div>
          <ToggleButton
            isChecked={userInfo.showTimerInTitle}
            setIsChecked={showTimerInTitleButtonClick}
          />
        </div>

        <div className="flex items-center justify-between gap-4 text-base sm:text-lg dark:text-textDark">
          <div className="relative w-fit">
            <div>{t('settingsModal.notifications')}</div>
            <div className="absolute pl-2 -top-2 left-full">
              <QuestionMarkTooltip
                tooltipText={t('settingsModal.notificationsTooltip')}
              />
            </div>
          </div>
          <ToggleButton
            isChecked={Notification.permission == 'granted'}
            setIsChecked={changeNotificationPermission}
          />
        </div>

        <div className="flex items-center justify-between gap-4 text-base sm:text-lg dark:text-textDark">
          <div>{t('settingsModal.language')}</div>
          <div className="w-[140px]">
            <CustomSelect
              lightBackground={false}
              currentId={i18n.language}
              onChange={onLangSelectChange}
              optionGroups={[
                {
                  optGroupName: '',
                  color: 'standart',
                  options: [
                    { id: 'en', name: 'english' },
                    { id: 'ru', name: 'русский' },
                  ],
                },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 pb-5">
        <div>
          <Button onClick={downloadUserDataFile}>
            {t('settingsModal.exportButton')}
          </Button>
        </div>

        <div>
          <Button onClick={logOutHandler}>
            {t('settingsModal.logoutButton')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsGeneralSection;
