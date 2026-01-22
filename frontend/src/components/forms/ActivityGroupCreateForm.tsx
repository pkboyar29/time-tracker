import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { createActivityGroup } from '../../api/activityGroupApi';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import Button from '../common/Button';
import Input from '../common/Input';

import { IActivityGroup } from '../../ts/interfaces/ActivityGroup/IActivityGroup';

interface ActivityGroupCreateFormProps {
  afterSubmitHandler: (newActivityGroup: IActivityGroup) => void;
}

interface ActivityGroupFields {
  name: string;
}

const ActivityGroupCreateForm: FC<ActivityGroupCreateFormProps> = ({
  afterSubmitHandler,
}) => {
  const { t } = useTranslation();

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
      toast(t('serverErrors.createGroup'), {
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
        placeHolder={t('createGroupModal.namePlaceholder')}
        validationRules={{
          required: t('createGroupModal.requiredError'),
          maxLength: {
            value: 50,
            message: t('createGroupModal.maxError', { count: 50 }),
          },
        }}
        errorMessage={
          typeof errors.name?.message === 'string' ? errors.name.message : ''
        }
      />

      <div className="ml-auto w-fit">
        <Button type="submit">{t('createGroupModal.button')}</Button>
      </div>
    </form>
  );
};

export default ActivityGroupCreateForm;
