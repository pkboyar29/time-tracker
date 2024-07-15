import { FC, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { fetchActivities, createActivity, updateActivity } from '../redux/slices/activitySlice'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../redux/store'

interface ActivityFields {
   name: string,
   descr?: string
}

const ActivitiesPage: FC = () => {
   const activities = useSelector((state: RootState) => state.activities.activities)
   const [currentActivity, setCurrentActivity] = useState<Activity | null>(null)

   const dispatch = useDispatch<AppDispatch>()

   const { register, handleSubmit, setValue } = useForm<ActivityFields>({ mode: 'onBlur' })

   useEffect(() => {
      dispatch(fetchActivities())
   }, [])

   const chooseCurrentActivity = (activity: Activity) => {
      setCurrentActivity(activity)

      setValue('name', activity.name)
      setValue('descr', activity.descr)
   }

   const onSubmit = (data: ActivityFields) => {
      if (!currentActivity) {
         dispatch(createActivity(data))
      } else {
         dispatch(updateActivity({
            id: currentActivity.id,
            ...data
         }))
      }
   }

   return (
      <>
         <div>
            <div className='mb-5'>All activities</div>
            <div className='flex flex-col gap-4'>
               {activities.map((activity: Activity) => (
                  <div onClick={() => chooseCurrentActivity(activity)} className='flex gap-4' key={activity.id}>
                     <div>{activity.name}</div>
                     <div>{activity.descr}</div>
                  </div>
               ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='mt-8 flex flex-col items-start gap-3'>
               <div>{!currentActivity ? 'Creating a new activity' : 'Updating an activity'}</div>
               <input {...register('name')} type='text' placeholder='Enter name' className='w-full p-1 rounded-md bg-red-500 text-white placeholder-white' />
               <textarea {...register('descr')} placeholder='Enter description (optional)' className='w-full h-20 p-1 rounded-md bg-red-500 text-white placeholder-white' />
               <button className='p-3 bg-red-500 text-white rounded-xl'>{!currentActivity ? 'Create activity' : 'Update activity'}</button>
            </form>
         </div>
      </>
   )
}

export default ActivitiesPage