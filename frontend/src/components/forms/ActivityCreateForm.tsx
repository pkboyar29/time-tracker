import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '../../redux/store';
import { createActivity } from '../../redux/slices/activitySlice';

import Button from '../Button';

interface ActivityCreateFormProps {
  afterSubmitHandler: () => void;
  activityGroupId: string;
}

interface ActivityFields {
  name: string;
  descr?: string;
}

const ActivityCreateForm: FC<ActivityCreateFormProps> = ({
  afterSubmitHandler,
  activityGroupId,
}) => {
  const dispatch = useAppDispatch();

  const { register, handleSubmit } = useForm<ActivityFields>({
    mode: 'onBlur',
  });

  const onSubmit = (data: ActivityFields) => {
    dispatch(
      createActivity({
        ...data,
        activityGroupId,
      })
    );
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
        className="w-full px-4 py-2 text-white placeholder-white bg-red-500 rounded-md"
      />
      <textarea
        {...register('descr')}
        placeholder="Enter description (optional)"
        className="w-full h-20 px-4 py-2 text-white placeholder-white bg-red-500 rounded-md"
      />
      <div className="flex justify-end w-full">
        <Button type="submit">Create activity</Button>
      </div>
    </form>
  );
};

export default ActivityCreateForm;
