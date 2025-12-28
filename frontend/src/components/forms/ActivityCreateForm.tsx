import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { createActivity } from '../../api/activityApi';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import Button from '../common/Button';
import Input from '../common/Input';

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
  const { t } = useTranslation();

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
      toast(t('serverErrors.createActivity'), {
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
        placeHolder={t('createActivityModal.namePlaceholder')}
        validationRules={{
          required: t('createActivityModal.requiredError'),
          maxLength: {
            value: 50,
            message: t('createActivityModal.maxError', { count: 50 }),
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
        placeHolder={t('createActivityModal.descrPlaceholder')}
        validationRules={{
          maxLength: {
            value: 500,
            message: t('createActivityModal.maxError', { count: 500 }),
          },
        }}
        errorMessage={
          typeof errors.descr?.message === 'string' ? errors.descr.message : ''
        }
      />

      <div className="ml-auto w-fit">
        <Button type="submit">{t('createActivityModal.button')}</Button>
      </div>
    </form>
  );
};

export default ActivityCreateForm;
