import { FC, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../../redux/store'
import axios from '../../axios'
import { createSession } from '../../redux/slices/sessionSlice'

import { mapActivityFromResponse } from '../../utils/mappingHelpers'

interface SessionCreateFormProps {
   afterSubmitHandler: () => void,
   defaultActivity?: string
}

interface SessionFields {
   spentTimeMinutes: number,
   activity: string
}

const SessionCreateForm: FC<SessionCreateFormProps> = ({ afterSubmitHandler, defaultActivity }) => {
   const [selectActivities, setSelectActivities] = useState<Activity[]>([])
   const { register, handleSubmit, reset } = useForm<SessionFields>({
      defaultValues: {
         activity: defaultActivity,
         spentTimeMinutes: 0
      }
   })
   const dispatch = useDispatch<AppDispatch>()

   useEffect(() => {
      const fetchActivities = async () => {
         const { data } = await axios.get('/activities')
         const mappedData = data.map((unmappedActivity: any) => mapActivityFromResponse(unmappedActivity))
         setSelectActivities(mappedData)
      }
      fetchActivities()
   }, [])

   useEffect(() => {
      if (defaultActivity) {
         reset()
      }
   }, [defaultActivity, selectActivities])

   const onSubmit = (data: SessionFields) => {
      dispatch(createSession({
         totalTimeSeconds: data.spentTimeMinutes * 60,
         spentTimeSeconds: 0,
         activity: data.activity !== '' ? data.activity : undefined
      }))
      afterSubmitHandler()
   }

   return (
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col items-start gap-3'>
         <input {...register('spentTimeMinutes')} type='number' placeholder='Enter minutes' className='p-1 rounded-md bg-red-500 text-white placeholder-white' />
         <select {...register('activity')}>
            <option value=''>Choose an activity</option>
            {selectActivities.map((activity: Activity) => (
               <option key={activity.id} value={activity.id}>
                  {activity.name}
               </option>
            ))}
         </select>
         <div>Choose a task</div>
         <button type='submit' className='p-3 bg-red-500 text-white rounded-xl'>Create session</button>
      </form>
   )
}

export default SessionCreateForm