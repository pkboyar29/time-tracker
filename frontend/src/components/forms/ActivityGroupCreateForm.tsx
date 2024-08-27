import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '../../redux/store';
import { createActivityGroup } from '../../redux/slices/activityGroupSlice';

import Button from '../Button';

interface ActivityGroupCreateFormProps {
  afterSubmitHandler: () => void;
}

interface ActivityGroupFields {
  name: string;
  descr?: string;
}

const ActivityGroupCreateForm: FC<ActivityGroupCreateFormProps> = ({
  afterSubmitHandler,
}) => {
  const dispatch = useAppDispatch();

  const { register, handleSubmit } = useForm<ActivityGroupFields>({
    mode: 'onBlur',
  });

  const onSubmit = (data: ActivityGroupFields) => {
    console.log(data);
    dispatch(createActivityGroup(data));
    afterSubmitHandler();
  };

  return (
    <form
      className="flex flex-col items-start gap-3"
      onSubmit={handleSubmit(onSubmit)}
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
        <Button type="submit">Create activity group</Button>
      </div>
    </form>
  );
};

export default ActivityGroupCreateForm;
