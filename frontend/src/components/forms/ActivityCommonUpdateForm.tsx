import { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import { updateActivity } from '../../redux/slices/activitySlice';
import { updateActivityGroup } from '../../redux/slices/activityGroupSlice';
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
  const dispatch = useDispatch<AppDispatch>();

  // попробовать все-таки это сделать декларативно, через defaultValues
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

  const onSubmit = (data: ActivityCommonFields) => {
    if ('activityGroupId' in activityCommon) {
      // IActivity
      dispatch(
        updateActivity({
          id: activityCommon.id,
          ...data,
        })
      );
    } else {
      // IActivityGroup
      dispatch(
        updateActivityGroup({
          id: activityCommon.id,
          ...data,
        })
      );
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
            'p-1 text-xl font-bold rounded-lg border border-solid border-gray-300 focus:border-blue-700 ' +
            (errors.name ? 'focus:border-red-500' : 'asdasd')
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
            'p-1 text-base font-medium rounded-lg h-28 border border-solid border-gray-300 focus:border-blue-700 ' +
            (errors.descr ? 'focus:border-red-500' : '')
          }
        />
      </div>
    </form>
  );
};

export default ActivityCommonUpdateForm;
