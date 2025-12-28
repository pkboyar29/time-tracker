import { FC, useState, ReactNode } from 'react';
import { useTimer } from '../../hooks/useTimer';
import { createSession } from '../../api/sessionApi';
import { toast } from 'react-toastify';
import { getReadableTime } from '../../helpers/timeHelpers';
import { useTranslation } from 'react-i18next';

import Modal from './Modal';
import Button from '../common/Button';
import RangeSlider from '../common/RangeSlider';

interface SessionCreateModalProps {
  onCloseModal: () => void;
  modalTitle: ReactNode;
  afterSubmitHandler: () => void;
  defaultActivity?: string;
}

const SessionCreateModal: FC<SessionCreateModalProps> = ({
  afterSubmitHandler,
  defaultActivity,
  onCloseModal,
  modalTitle,
}) => {
  const { t } = useTranslation();

  const { startTimer } = useTimer();

  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);

  const onSubmit = async () => {
    try {
      const newSession = await createSession({
        totalTimeSeconds: selectedMinutes * 60,
        spentTimeSeconds: 0,
        activity: defaultActivity,
      });
      startTimer(newSession);

      afterSubmitHandler();
    } catch (e) {
      toast(t('serverErrors.startSession'), {
        type: 'error',
      });
    }
  };

  return (
    <Modal title={modalTitle} onCloseModal={onCloseModal}>
      <form className="flex flex-col items-start gap-10">
        <div className="flex flex-col w-full gap-3">
          <div className="flex gap-1 dark:text-textDark">
            {getReadableTime(selectedMinutes * 60, t, {
              short: false,
              zeroUnits: true,
            })}
          </div>

          <RangeSlider
            minValue={1}
            maxValue={600}
            currentValue={selectedMinutes}
            changeCurrentValue={(newCurrentValue) =>
              setSelectedMinutes(newCurrentValue)
            }
          />
        </div>

        <div className="ml-auto w-fit">
          <Button onClick={onSubmit}>{t('createSessionModal.button')}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default SessionCreateModal;
