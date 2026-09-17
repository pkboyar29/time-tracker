import { FC, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../../api/axios';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import Cookies from 'js-cookie';
import { refreshAccessToken, isAuthRequired } from '../../helpers/authHelpers';

import Modal from './Modal';
import Button from '../common/Button';

interface DailyGoalCompletedModalProps {}

const DailyGoalCompletedModal: FC<DailyGoalCompletedModalProps> = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const { t } = useTranslation();

  const location = useLocation();
  const authRequired = isAuthRequired(location.pathname);

  useEffect(() => {
    const subscribeToServerEvents = async () => {
      if (!authRequired) {
        return;
      }

      await fetchEventSource(`${API_URL}/events`, {
        headers: {
          Authorization: `Bearer ${Cookies.get('access')}`,
        },
        async onopen(response) {
          if (response.ok) {
            return;
          }
          if (response.status === 403) {
            throw new Error('REFRESH_REQUIRED');
          } else {
            throw new Error(`SERVER_ERROR_${response.status}`);
          }
        },
        onmessage: (event) => {
          try {
            if (event.event === 'daily_goal_completed') {
              const data = JSON.parse(event.data);

              setStreak(data.streak);
              setIsOpen(true);
            }
          } catch (e) {
            console.error(e);
          }
        },
        onerror: (error) => {
          if (error.message === 'REFRESH_REQUIRED') {
            refreshAccessToken();
            throw error;
          }
        },
      });
    };

    subscribeToServerEvents();
  }, [authRequired]);

  return (
    <Modal
      title={t('dailyGoalCompletedModal.title')}
      isOpen={isOpen}
      onCloseModal={() => setIsOpen(false)}
    >
      <div className="flex flex-col items-center px-6 py-4 pt-8 text-center">
        <div className="flex items-center justify-center w-20 h-20 mb-4 bg-green-100 rounded-full">
          <span className="text-3xl">🎉</span>
        </div>

        <p className="mb-3 text-lg text-gray-700 dark:text-textDark">
          {t('dailyGoalCompletedModal.message')}
        </p>

        {streak === 1 ? (
          <p className="mb-6 text-sm font-medium text-green-600 dark:text-green-400">
            {t('dailyGoalCompletedModal.streakStarted')}
          </p>
        ) : streak > 1 ? (
          <p className="mb-6 text-sm font-medium text-green-600 dark:text-green-400">
            {t('dailyGoalCompletedModal.streakMessage', { streak })}
          </p>
        ) : (
          <div className="mb-6" />
        )}

        <Button onClick={() => setIsOpen(false)}>{t('dailyGoalCompletedModal.button')}</Button>
      </div>
    </Modal>
  );
};

export default DailyGoalCompletedModal;
