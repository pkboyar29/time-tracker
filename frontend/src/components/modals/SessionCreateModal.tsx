import { FC, useState, ReactNode } from 'react';
import { useTimer } from '../../hooks/useTimer';
import { createSession } from '../../api/sessionApi';
import { toast } from 'react-toastify';

import Modal from './Modal';
import Button from '../Button';
import RangeSlider from '../RangeSlider';

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
      toast('A server error occurred while creating new session', {
        type: 'error',
      });
    }
  };

  return (
    <Modal title={modalTitle} onCloseModal={onCloseModal}>
      <form className="flex flex-col items-start gap-10">
        <div className="flex flex-col w-full gap-3">
          <div className="flex gap-1 dark:text-textDark">
            <div>{selectedMinutes} minutes</div>
            {selectedMinutes > 60 && (
              <div>
                ({Math.floor(selectedMinutes / 60)} hours
                {selectedMinutes % 60 > 0 && (
                  <> {selectedMinutes % 60} minutes</>
                )}
                )
              </div>
            )}
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
          <Button onClick={onSubmit}>Start new session</Button>
        </div>
      </form>
    </Modal>
  );
};

export default SessionCreateModal;
