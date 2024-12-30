import { FC, useState, useEffect, ChangeEvent, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '../../redux/store';
import axios from '../../axios';
import { createSession } from '../../redux/slices/sessionSlice';

import Modal from './Modal';
import Button from '../Button';

import {
  mapActivityFromResponse,
  mapActivityGroupFromResponse,
} from '../../helpers/mappingHelpers';
import { IActivity } from '../../ts/interfaces/Activity/IActivity';
import { IActivityGroup } from '../../ts/interfaces/ActivityGroup/IActivityGroup';
import { ISession } from '../../ts/interfaces/Session/ISession';

interface SessionCreateModalProps {
  onCloseModal: () => void;
  modalTitle: ReactNode;
  afterSubmitHandler: (session: ISession) => void;
  defaultActivity?: string;
}

interface SessionFields {
  totalTimeMinutes: number;
  activityGroupId: string;
  activity: string;
}

const SessionCreateModal: FC<SessionCreateModalProps> = ({
  afterSubmitHandler,
  defaultActivity,
  onCloseModal,
  modalTitle,
}) => {
  const [activityGroupsInSelect, setActivityGroupsInSelect] = useState<
    IActivityGroup[]
  >([]);
  const [activitiesInSelect, setActivitiesInSelect] = useState<IActivity[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    resetField,
    formState: { errors, isValid },
  } = useForm<SessionFields>({
    defaultValues: {
      activity: defaultActivity,
    },
    mode: 'onBlur',
  });
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchActivityGroups = async () => {
      const { data } = await axios.get('/activity-groups');
      const mappedData = data.map((unmappedActivityGroup: any) =>
        mapActivityGroupFromResponse(unmappedActivityGroup)
      );
      setActivityGroupsInSelect(mappedData);
    };
    fetchActivityGroups();
  }, []);

  useEffect(() => {
    if (defaultActivity) {
      reset();
    }
  }, [defaultActivity, activitiesInSelect]);

  const handleActivityGroupSelectChange = async (
    e: ChangeEvent<HTMLSelectElement>
  ) => {
    setActivitiesInSelect([]);
    resetField('activity');

    const activityGroupId: string = e.currentTarget.value;
    if (activityGroupId !== '') {
      const { data } = await axios.get('/activities', {
        params: {
          activityGroupId,
        },
      });
      const mappedData = data.map((unmappedActivity: any) =>
        mapActivityFromResponse(unmappedActivity)
      );
      setActivitiesInSelect(mappedData);
    }
  };

  const onSubmit = async (data: SessionFields) => {
    try {
      const { payload } = await dispatch(
        createSession({
          totalTimeSeconds: data.totalTimeMinutes * 60,
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
        className="flex flex-col items-start gap-3"
      >
        <div className="w-full">
          <input
            {...register('totalTimeMinutes', {
              required: 'Required!',
              max: {
                value: 600,
                message: '10 hours - max!',
              },
              min: {
                value: 1,
                message: '1 min - min!',
              },
            })}
            type="number"
            placeholder="Enter minutes (max - 10 hours)"
            className="w-full px-4 py-2 text-white placeholder-white bg-red-500 rounded-md"
          />
          {errors.totalTimeMinutes && (
            <p className="mt-2 text-red-500">
              {errors.totalTimeMinutes.message || 'Error!'}
            </p>
          )}
        </div>

        {!defaultActivity ? (
          <>
            <select onChange={handleActivityGroupSelectChange}>
              <option value="">Choose activity group (optional)</option>
              {activityGroupsInSelect.map((activityGroup) => (
                <option key={activityGroup.id} value={activityGroup.id}>
                  {activityGroup.name}
                </option>
              ))}
            </select>

            {activitiesInSelect.length > 0 && (
              <select
                {...register('activity', {
                  required: 'Required!',
                })}
              >
                <option value="">Choose activity</option>
                {activitiesInSelect.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name}
                  </option>
                ))}
              </select>
            )}
            {errors.activity && (
              <p className="mt-2 text-red-500">
                {errors.activity.message || 'Error!'}
              </p>
            )}
          </>
        ) : (
          <></>
        )}

        <div className="flex justify-end w-full">
          <Button type="submit" disabled={!isValid}>
            Create session
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SessionCreateModal;
