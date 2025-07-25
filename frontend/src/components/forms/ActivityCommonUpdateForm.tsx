import { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '../../redux/store';
import { toast } from 'react-toastify';

import { updateActivity } from '../../redux/slices/activitySlice';
import { updateActivityGroup } from '../../api/activityGroupApi';

import { IActivity } from '../../ts/interfaces/Activity/IActivity';
import { IActivityGroup } from '../../ts/interfaces/ActivityGroup/IActivityGroup';

interface ActivityCommonUpdateFormProps {
  activityCommon: IActivity | IActivityGroup;
}

interface ActivityCommonFields {
  name: string;
  descr?: string;
}

const ActivityCommonUpdateForm: FC<ActivityCommonUpdateFormProps> = ({
  activityCommon,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ActivityCommonFields>({
    mode: 'onBlur',
  });
  const dispatch = useAppDispatch();

  // TODO: попробовать все-таки это сделать декларативно, через defaultValues
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

  const onSubmit = async (data: ActivityCommonFields) => {
    if ('activityGroup' in activityCommon) {
      // IActivity
      try {
        await dispatch(
          updateActivity({
            id: activityCommon.id,
            ...data,
          })
        ).unwrap();
      } catch (e) {
        toast('A server error occurred while updating activity', {
          type: 'error',
        });
      }
    } else {
      // IActivityGroup
      try {
        await updateActivityGroup({ id: activityCommon.id, ...data });
      } catch (e) {
        toast('A server error occurred while updating activity group', {
          type: 'error',
        });
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
          onBlur={handleSubmit(onSubmit)}
          type="text"
          className={
            'p-1 text-xl font-bold rounded-lg border border-solid border-transparent focus:border-blue-700 hover:bg-gray-100 bg-transparent focus:bg-transparent' +
            (errors.name ? 'focus:border-red-500' : '')
          }
        />

        <textarea
          placeholder="Enter desciption"
          {...register('descr', {
            maxLength: 500,
          })}
          onFocus={handleFocus}
          onBlur={handleSubmit(onSubmit)}
          className={
            'p-1 text-base font-medium rounded-lg h-28 border border-solid border-gray-300 focus:border-blue-700 bg-transparent' +
            (errors.descr ? 'focus:border-red-500' : '')
          }
        />
      </div>
    </form>
  );
};

export default ActivityCommonUpdateForm;
