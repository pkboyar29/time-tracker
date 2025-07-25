import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { createActivityGroup } from '../../api/activityGroupApi';

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
      console.log(e);
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
        <Button type="submit">Create activity group</Button>
      </div>
    </form>
  );
};

export default ActivityGroupCreateForm;
