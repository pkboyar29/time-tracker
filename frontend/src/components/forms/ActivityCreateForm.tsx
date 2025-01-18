import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '../../redux/store';
import { createActivity } from '../../redux/slices/activitySlice';

import Button from '../Button';
import Input from '../Input';

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivityFields>({
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
      className="flex flex-col items-start gap-3 text-base"
    >
      <Input
        fieldName="name"
        register={register}
        bg="red"
        placeHolder="Enter name"
        validationRules={{
          required: 'Field is required',
        }}
        errorMessage={
          typeof errors.name?.message === 'string' ? errors.name.message : ''
        }
      />

      <Input
        isTextArea={true}
        fieldName="descr"
        register={register}
        bg="red"
        placeHolder="Enter description (optional)"
        validationRules={{}}
        errorMessage=""
      />

      <div className="flex justify-end w-full">
        <Button type="submit">Create activity</Button>
      </div>
    </form>
  );
};

export default ActivityCreateForm;
