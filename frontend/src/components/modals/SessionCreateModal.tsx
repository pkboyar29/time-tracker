import { FC, useState, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { createSession, updateSession } from '../../redux/slices/sessionSlice';
import { useQueryCustom } from '../../hooks/useQueryCustom';
import { fetchActivities } from '../../api/activityApi';
import { toast } from 'react-toastify';
import { useStartSession } from '../../hooks/useStartSession';

import Modal from './Modal';
import Button from '../Button';
import RangeSlider from '../RangeSlider';
import PrimaryClipLoader from '../PrimaryClipLoader';

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
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector(
    (state) => state.sessions.currentSession
  );
  const { startSession } = useStartSession();

  const { data: activitiesToChoose, isLoading: isLoadingActivities } =
    useQueryCustom({
      queryKey: ['activitiesToChoose'],
      queryFn: () => fetchActivities(),
    });

  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    defaultActivity ? defaultActivity : ''
  );

  const onSubmit = async () => {
    try {
      if (currentSession) {
        dispatch(updateSession(currentSession));
      }

      const newSession = await dispatch(
        createSession({
          totalTimeSeconds: selectedMinutes * 60,
          spentTimeSeconds: 0,
          activity: selectedActivityId !== '' ? selectedActivityId : undefined,
        })
      ).unwrap();
      startSession(newSession);

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

        <div className="h-[42px]">
          {isLoadingActivities ? (
            <PrimaryClipLoader size="25px" />
          ) : (
            activitiesToChoose && (
              <div className="flex flex-col gap-3 dark:text-textDark">
                <div>Activity</div>

                <select
                  value={selectedActivityId}
                  className="px-2 py-1 border border-black border-solid dark:border-gray-500 rounded-xl dark:bg-surfaceDark"
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
                      {activity.name}
                    </option>
                  ))}
                </select>
              </div>
            )
          )}
        </div>
        <div className="ml-auto w-fit">
          <Button onClick={onSubmit}>Start new session</Button>
        </div>
      </form>
    </Modal>
  );
};

export default SessionCreateModal;
