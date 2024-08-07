import { FC, useState, useEffect, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import axios from '../../axios';
import { createSession } from '../../redux/slices/sessionSlice';

import Button from '../Button';

import {
  mapActivityFromResponse,
  mapActivityGroupFromResponse,
} from '../../utils/mappingHelpers';
import { IActivity } from '../../ts/interfaces/Activity/IActivity';
import { IActivityGroup } from '../../ts/interfaces/ActivityGroup/IActivityGroup';

interface SessionCreateFormProps {
  afterSubmitHandler: () => void;
  defaultActivity?: string;
}

interface SessionFields {
  totalTimeMinutes: number;
  activityGroupId: string;
  activity: string;
}

const SessionCreateForm: FC<SessionCreateFormProps> = ({
  afterSubmitHandler,
  defaultActivity,
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
  const dispatch = useDispatch<AppDispatch>();

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

  const onActivityGroupSelectChange = async (
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

  const onSubmit = (data: SessionFields) => {
    console.log(data);
    dispatch(
      createSession({
        totalTimeSeconds: data.totalTimeMinutes * 60,
        spentTimeSeconds: 0,
        activity: data.activity !== '' ? data.activity : undefined,
      })
    );
    afterSubmitHandler();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col items-start gap-3"
    >
      <div>
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
          className="p-1 text-white placeholder-white bg-red-500 rounded-md"
        />
        {errors.totalTimeMinutes && (
          <p className="mt-2 text-red-500">
            {errors.totalTimeMinutes.message || 'Error!'}
          </p>
        )}
      </div>

      {!defaultActivity ? (
        <>
          <select onChange={onActivityGroupSelectChange}>
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

      <Button type="submit" disabled={!isValid}>
        Create session
      </Button>
    </form>
  );
};

export default SessionCreateForm;
