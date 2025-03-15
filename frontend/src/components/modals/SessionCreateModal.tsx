import { FC, useState, useEffect, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '../../redux/store';
import axios from '../../axios';
import { createSession } from '../../redux/slices/sessionSlice';

import Modal from './Modal';
import Button from '../Button';
import RangeSlider from '../RangeSlider';

import { mapActivityFromResponse } from '../../helpers/mappingHelpers';
import { IActivity } from '../../ts/interfaces/Activity/IActivity';
import { ISession } from '../../ts/interfaces/Session/ISession';

interface SessionCreateModalProps {
  onCloseModal: () => void;
  modalTitle: ReactNode;
  afterSubmitHandler: (session: ISession) => void;
  defaultActivity?: string;
}

interface SessionFields {
  activity: string;
}

const SessionCreateModal: FC<SessionCreateModalProps> = ({
  afterSubmitHandler,
  defaultActivity,
  onCloseModal,
  modalTitle,
}) => {
  const [activitiesToChoose, setActivitiesToChoose] = useState<IActivity[]>([]);

  const [minutes, setMinutes] = useState<number>(25);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<SessionFields>({
    defaultValues: {
      activity: defaultActivity,
    },
    mode: 'onBlur',
  });
  const dispatch = useAppDispatch();

  // TODO: начать получать все активности с названиями активностей групп
  useEffect(() => {
    const fetchActivities = async () => {
      const { data } = await axios.get('/activities');
      const mappedData: IActivity[] = data.map((unmappedActivity: any) =>
        mapActivityFromResponse(unmappedActivity)
      );
      setActivitiesToChoose(mappedData);
    };
    fetchActivities();
  }, []);

  useEffect(() => {
    if (defaultActivity) {
      reset();
    }
  }, [defaultActivity, activitiesToChoose]);

  const onSubmit = async (data: SessionFields) => {
    try {
      const { payload } = await dispatch(
        createSession({
          totalTimeSeconds: minutes * 60,
          spentTimeSeconds: 0,
          activity: data.activity !== '' ? data.activity : undefined,
        })
      );

      afterSubmitHandler(payload as ISession);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Modal title={modalTitle} onCloseModal={onCloseModal}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col items-start gap-10"
      >
        <div className="flex flex-col w-full gap-3">
          <div className="flex gap-1">
            <div>{minutes} minutes</div>
            {minutes > 60 && (
              <div>
                ({Math.floor(minutes / 60)} hours
                {minutes % 60 > 0 && <> {minutes % 60} minutes</>})
              </div>
            )}
          </div>

          <RangeSlider
            minValue={1}
            maxValue={600}
            currentValue={minutes}
            changeCurrentValue={(newCurrentValue) =>
              setMinutes(newCurrentValue)
            }
          />
        </div>

        {activitiesToChoose.length > 0 && (
          <div className="flex flex-col gap-3">
            <div>Activity</div>

            <select
              className="px-2 py-1 border border-black border-solid rounded-xl"
              {...register('activity')}
            >
              <option value="">Choose activity (optional)</option>
              {activitiesToChoose.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.activityGroup.name} / {activity.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex w-full">
          <Button type="submit" disabled={!isValid}>
            Create session
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SessionCreateModal;
