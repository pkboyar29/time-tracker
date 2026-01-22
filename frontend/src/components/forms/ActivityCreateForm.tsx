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
  color: string;
}

const ActivityCreateForm: FC<ActivityCreateFormProps> = ({
  afterSubmitHandler,
  activityGroupId,
}) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ActivityFields>({
    mode: 'onBlur',
    defaultValues: {
      name: '',
      color: '#3B82F6',
    },
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

      <div className="flex items-center gap-3">
        <label
          htmlFor="color"
          className="text-sm text-gray-600 dark:text-textDark"
        >
          {t('createActivityModal.colorLabel')}
        </label>

        <div className="flex items-center gap-3">
          <input
            type="color"
            id="color"
            {...register('color', {
              required: true,
            })}
            className="p-0 rounded-md cursor-pointer dark:bg-surfaceDark"
          />

          <span className="font-mono text-sm text-gray-400 opacity-60">
            {watch('color')}
          </span>
        </div>
      </div>

      <div className="ml-auto w-fit">
        <Button type="submit">{t('createActivityModal.button')}</Button>
      </div>
    </form>
  );
};

export default ActivityCreateForm;
