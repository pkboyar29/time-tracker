import { FC, useState, useEffect, ReactNode } from 'react';
import { useAppDispatch } from '../../redux/store';
import { createSession } from '../../redux/slices/sessionSlice';
import { saveSessionToLocalStorage } from '../../helpers/localstorageHelpers';
import { useQuery } from '@tanstack/react-query';
import { fetchActivities, fetchGroupActivities } from '../../api/activityApi';
import { toast } from 'react-toastify';

import Modal from './Modal';
import Button from '../Button';
import RangeSlider from '../RangeSlider';
import { ClipLoader } from 'react-spinners';

import { ISession } from '../../ts/interfaces/Session/ISession';

interface SessionCreateModalProps {
  onCloseModal: () => void;
  modalTitle: ReactNode;
  afterSubmitHandler: (session: ISession) => void;
  defaultActivity?: string;
}

const SessionCreateModal: FC<SessionCreateModalProps> = ({
  afterSubmitHandler,
  defaultActivity,
  onCloseModal,
  modalTitle,
}) => {
  const { data: activitiesToChoose, isLoading: isLoadingActivities } = useQuery(
    {
      queryKey: ['activitiesToChoose'],
      queryFn: () => fetchActivities(),
      retry: false,
    }
  );

  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    defaultActivity ? defaultActivity : ''
  );

  const dispatch = useAppDispatch();

  const onSubmit = async () => {
    try {
      const payload = await dispatch(
        createSession({
          totalTimeSeconds: selectedMinutes * 60,
          spentTimeSeconds: 0,
          activity: selectedActivityId !== '' ? selectedActivityId : undefined,
        })
      ).unwrap();
      saveSessionToLocalStorage(payload.id);

      afterSubmitHandler(payload);
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
          <div className="flex gap-1">
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

        {/* TODO: как-то отображать в контейнере с одной высотой, чтобы не дергался контент */}
        {isLoadingActivities ? (
          <ClipLoader size={'25px'} color="#EF4444" />
        ) : (
          activitiesToChoose &&
          activitiesToChoose.remainingActivities.length > 0 && (
            <div className="flex flex-col gap-3">
              <div>Activity</div>

              <select
                value={selectedActivityId}
                className="px-2 py-1 border border-black border-solid rounded-xl"
                onChange={(e) => {
                  setSelectedActivityId(e.target.value);
                }}
              >
                <option value="">Choose activity (optional)</option>
                {[
                  ...activitiesToChoose.topActivities,
                  ...activitiesToChoose.remainingActivities,
                ].map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.activityGroup.name} / {activity.name}
                  </option>
                ))}
              </select>
            </div>
          )
        )}

        <div className="flex w-full">
          <Button onClick={onSubmit}>Start new session</Button>
        </div>
      </form>
    </Modal>
  );
};

export default SessionCreateModal;
