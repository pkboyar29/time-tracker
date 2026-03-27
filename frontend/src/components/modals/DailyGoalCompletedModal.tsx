import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import Modal from './Modal';
import Button from '../common/Button';

interface DailyGoalCompletedModalProps {
  onCloseModal: () => void;
}

const DailyGoalCompletedModal: FC<DailyGoalCompletedModalProps> = ({
  onCloseModal,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t('dailyGoalCompletedModal.title')}
      onCloseModal={onCloseModal}
    >
      <div className="flex flex-col items-center px-6 py-4 pt-8 text-center">
        <div className="flex items-center justify-center w-20 h-20 mb-4 bg-green-100 rounded-full">
          <span className="text-3xl">🎉</span>
        </div>

        <p className="mb-6 text-lg text-gray-700 dark:text-textDark">
          {t('dailyGoalCompletedModal.message')}
        </p>

        <Button onClick={onCloseModal}>
          {t('dailyGoalCompletedModal.button')}
        </Button>
      </div>
    </Modal>
  );
};

export default DailyGoalCompletedModal;
