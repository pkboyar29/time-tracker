import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { createActivity } from '../../api/activityApi';
import { toast } from 'react-toastify';

import Button from '../Button';
import Input from '../Input';

import { IActivity } from '../../ts/interfaces/Activity/IActivity';

interface ActivityCreateFormProps {
  afterSubmitHandler: (newActivity: IActivity) => void;
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivityFields>({
    mode: 'onBlur',
  });

  const onSubmit = async (data: ActivityFields) => {
    try {
      const newActivity = await createActivity({ ...data, activityGroupId });

      afterSubmitHandler(newActivity);
    } catch (e) {
      toast('A server error occurred while creating activity', {
        type: 'error',
      });
    }
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
