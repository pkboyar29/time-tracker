import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { createActivityGroup } from '../../api/activityGroupApi';
import { toast } from 'react-toastify';

import Button from '../Button';
import Input from '../Input';

import { IActivityGroup } from '../../ts/interfaces/ActivityGroup/IActivityGroup';

interface ActivityGroupCreateFormProps {
  afterSubmitHandler: (newActivityGroup: IActivityGroup) => void;
}

interface ActivityGroupFields {
  name: string;
  descr?: string;
}

const ActivityGroupCreateForm: FC<ActivityGroupCreateFormProps> = ({
  afterSubmitHandler,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivityGroupFields>({
    mode: 'onBlur',
  });

  const onSubmit = async (data: ActivityGroupFields) => {
    try {
      const newActivityGroup = await createActivityGroup(data);

      afterSubmitHandler(newActivityGroup);
    } catch (e) {
      toast('A server error occurred while creating activity group', {
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
        bg={true}
        placeHolder="Enter name"
        validationRules={{
          required: 'Field is required',
          maxLength: {
            value: 50,
            message: 'Max 50 is allowed',
          },
        }}
        errorMessage={
          typeof errors.name?.message === 'string' ? errors.name.message : ''
        }
      />

      <Input
        isTextArea={true}
        fieldName="descr"
        register={register}
        bg={true}
        placeHolder="Enter description (optional)"
        validationRules={{
          maxLength: {
            value: 500,
            message: 'Max 500 is allowed',
          },
        }}
        errorMessage={
          typeof errors.descr?.message === 'string' ? errors.descr.message : ''
        }
      />

      <div className="flex justify-end w-full">
        <Button type="submit">Create activity group</Button>
      </div>
    </form>
  );
};

export default ActivityGroupCreateForm;
