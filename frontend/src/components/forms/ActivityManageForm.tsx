import { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import {
  createActivity,
  updateActivity,
} from '../../redux/slices/activitySlice';

interface ActivityManageFormProps {
  currentActivity: IActivity | null;
  afterSubmitHandler: () => void;
}

interface ActivityFields {
  name: string;
  descr?: string;
}

const ActivityManageForm: FC<ActivityManageFormProps> = ({
  currentActivity,
  afterSubmitHandler,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const { register, handleSubmit } = useForm<ActivityFields>({
    mode: 'onBlur',
    defaultValues: {
      name: currentActivity?.name,
      descr: currentActivity?.descr,
    },
  });

  const onSubmit = (data: ActivityFields) => {
    if (!currentActivity) {
      dispatch(createActivity(data));
    } else {
      dispatch(
        updateActivity({
          id: currentActivity.id,
          ...data,
        })
      );
    }
    afterSubmitHandler();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col items-start gap-3"
    >
      <input
        {...register('name')}
        type="text"
        placeholder="Enter name"
        className="w-full p-1 text-white placeholder-white bg-red-500 rounded-md"
      />
      <textarea
        {...register('descr')}
        placeholder="Enter description (optional)"
        className="w-full h-20 p-1 text-white placeholder-white bg-red-500 rounded-md"
      />
      <div className="flex gap-4">
        <button type="submit" className="p-3 text-white bg-red-500 rounded-xl">
          {!currentActivity ? 'Create activity' : 'Update activity'}
        </button>
      </div>
    </form>
  );
};

export default ActivityManageForm;
