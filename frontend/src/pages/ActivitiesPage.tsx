import { FC, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { fetchActivities, createActivity } from '../redux/slices/activitySlice'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../redux/store'

interface ActivityFields {
   name: string,
   descr?: string
}

const ActivitiesPage: FC = () => {
   const activities = useSelector((state: RootState) => state.activities.activities)
   const dispatch = useDispatch<AppDispatch>()

   const { register, handleSubmit } = useForm<ActivityFields>({ mode: 'onBlur' })

   useEffect(() => {
      dispatch(fetchActivities())
   }, [])

   const onSubmit = (data: ActivityFields) => {
      dispatch(createActivity(data))
   }

   return (
      <>
         <div>
            <div className='mb-5'>All activities</div>
            <div className='flex flex-col gap-4'>
               {activities.map((activity: Activity) => (
                  <div className='flex gap-4' key={activity.id}>
                     <div>{activity.name}</div>
                     <div>{activity.descr}</div>
                  </div>
               ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='mt-8 flex flex-col items-start gap-3'>
               <div>Creating a new activity</div>
               <input {...register('name')} type='text' placeholder='Enter name' className='w-full p-1 rounded-md bg-red-500 text-white placeholder-white' />
               <textarea {...register('descr')} placeholder='Enter description (optional)' className='w-full h-20 p-1 rounded-md bg-red-500 text-white placeholder-white' />
               <button className='p-3 bg-red-500 text-white rounded-xl'>Create activity</button>
            </form>
         </div>
      </>
   )
}

export default ActivitiesPage