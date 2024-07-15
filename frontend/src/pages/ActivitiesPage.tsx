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

   const { register, handleSubmit, setValue, reset } = useForm<ActivityFields>({ mode: 'onBlur' })

   useEffect(() => {
      dispatch(fetchActivities())
   }, [])

   const chooseCurrentActivity = (activity: Activity) => {
      setCurrentActivity(activity)

      setValue('name', activity.name)
      setValue('descr', activity.descr)
   }

   const refreshForm = () => {
      setCurrentActivity(null)
      reset()
   }

   const onSubmit = (data: ActivityFields) => {
      console.log('trigger')
      if (!currentActivity) {
         dispatch(createActivity(data))
      } else {
         dispatch(updateActivity({
            id: currentActivity.id,
            ...data
         }))
      }
      refreshForm()
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
               <div className='flex gap-4'>
                  <button type='submit' className='p-3 bg-red-500 text-white rounded-xl'>{!currentActivity ? 'Create activity' : 'Update activity'}</button>
                  <button type='button' onClick={refreshForm}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg></button>
               </div>
            </form>
         </div>
      </>
   )
}

export default ActivitiesPage