import { FC, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import axios from '../../axios';
import { createSession } from '../../redux/slices/sessionSlice';

import Button from '../Button';

import { mapActivityFromResponse } from '../../utils/mappingHelpers';

interface SessionCreateFormProps {
  afterSubmitHandler: () => void;
  defaultActivity?: string;
}

interface SessionFields {
  totalTimeMinutes: number;
  activity: string;
}

const SessionCreateForm: FC<SessionCreateFormProps> = ({
  afterSubmitHandler,
  defaultActivity,
}) => {
  const [selectActivities, setSelectActivities] = useState<IActivity[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<SessionFields>({
    defaultValues: {
      activity: defaultActivity,
    },
    mode: 'onBlur',
  });
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const fetchActivities = async () => {
      const { data } = await axios.get('/activities');
      const mappedData = data.map((unmappedActivity: any) =>
        mapActivityFromResponse(unmappedActivity)
      );
      setSelectActivities(mappedData);
    };
    fetchActivities();
  }, []);

  useEffect(() => {
    if (defaultActivity) {
      reset();
    }
  }, [defaultActivity, selectActivities]);

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
      <select {...register('activity')}>
        <option value="">Choose an activity (optional)</option>
        {selectActivities.map((activity: IActivity) => (
          <option key={activity.id} value={activity.id}>
            {activity.name}
          </option>
        ))}
      </select>
      <div>Choose a task (optional)</div>
      <Button type="submit" disabled={!isValid}>
        Create session
      </Button>
    </form>
  );
};

export default SessionCreateForm;
