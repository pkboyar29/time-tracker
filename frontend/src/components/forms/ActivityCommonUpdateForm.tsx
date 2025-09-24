import { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';

import { updateActivityGroup } from '../../api/activityGroupApi';
import { updateActivity } from '../../api/activityApi';

import { IActivity } from '../../ts/interfaces/Activity/IActivity';
import { IActivityGroup } from '../../ts/interfaces/ActivityGroup/IActivityGroup';

interface ActivityCommonUpdateFormProps {
  activityCommon: IActivity | IActivityGroup;
  afterUpdateHandler: (
    updatedActivityCommon: IActivity | IActivityGroup
  ) => void;
}

interface ActivityCommonFields {
  name: string;
  descr?: string;
}

const ActivityCommonUpdateForm: FC<ActivityCommonUpdateFormProps> = ({
  activityCommon,
  afterUpdateHandler,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<ActivityCommonFields>({
    mode: 'onBlur',
  });
  const name = watch('name');
  const descr = watch('descr');

  useEffect(() => {
    setValue('name', activityCommon.name);
    setValue('descr', activityCommon.descr);
  }, [activityCommon]);

  const handleFocus = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const end = e.target.value.length;
    setTimeout(() => {
      e.target.setSelectionRange(end, end);
    }, 0);
  };

  const handleBlur = () => {
    if (name != activityCommon.name || descr != activityCommon.descr) {
      handleSubmit(onSubmit)();
    }
  };

  const onSubmit = async (data: ActivityCommonFields) => {
    if ('activityGroup' in activityCommon) {
      // IActivity
      try {
        const updatedData = await updateActivity({
          id: activityCommon.id,
          ...data,
        });

        afterUpdateHandler(updatedData);
      } catch (e) {
        if (e instanceof AxiosError) {
          toast(
            e.response
              ? e.response.data
              : 'A server error occurred while updating activity',
            {
              type: 'error',
            }
          );
        } else {
          toast('A server error occurred while updating activity', {
            type: 'error',
          });
        }
        setValue('name', activityCommon.name);
      }
    } else {
      // IActivityGroup
      try {
        const updatedData = await updateActivityGroup({
          id: activityCommon.id,
          ...data,
        });

        afterUpdateHandler(updatedData);
      } catch (e) {
        if (e instanceof AxiosError) {
          toast(
            e.response
              ? e.response.data
              : 'A server error occurred while updating activity group',
            {
              type: 'error',
            }
          );
        } else {
          toast('A server error occurred while updating activity group', {
            type: 'error',
          });
        }
        setValue('name', activityCommon.name);
      }
    }
  };

  return (
    <form>
      <div className="inline-flex flex-col gap-2">
        <input
          {...register('name', {
            required: true,
            maxLength: 50,
            minLength: 1,
          })}
          onFocus={handleFocus}
          onBlur={handleBlur}
          type="text"
          className={
            'p-1 text-xl font-bold rounded-lg dark:text-textDark border border-solid border-transparent focus:border-blue-700 hover:bg-gray-100 dark:hover:bg-surfaceDarkHover bg-transparent focus:bg-transparent' +
            (errors.name ? 'focus:border-primary' : '')
          }
        />

        <textarea
          placeholder="Enter desciption"
          {...register('descr', {
            maxLength: 500,
          })}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={
            'p-1 text-base font-medium rounded-lg dark:text-textDark h-28 border border-solid border-gray-300 dark:border-gray-500 focus:border-blue-700 bg-transparent' +
            (errors.descr ? 'focus:border-primary' : '')
          }
        />
      </div>
    </form>
  );
};

export default ActivityCommonUpdateForm;
