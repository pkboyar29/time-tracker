import { FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../redux/store'
import { fetchActivities, createActivity, updateActivity, deleteActivity } from '../redux/slices/activitySlice'

import ActivityManageForm from '../components/forms/ActivityManageForm'
import SessionCreateForm from '../components/forms/SessionCreateForm'
import ActivityItem from '../components/ActivityItem'
import Button from '../components/Button'
import Modal from '../components/Modal'

const ActivitiesPage: FC = () => {
   const activities = useSelector((state: RootState) => state.activities.activities)
   const [currentActivity, setCurrentActivity] = useState<IActivity | null>(null)
   const [manageModal, setManageModal] = useState<boolean>(false)
   const [deleteModal, setDeleteModal] = useState<string | null>(null) // we store here id of activity we want to delete or null
   const [createSessionModal, setCreateSessionModal] = useState<string | null>(null) // we store here id of activity we want to create session of or null

   const dispatch = useDispatch<AppDispatch>()
   const navigate = useNavigate()

   useEffect(() => {
      dispatch(fetchActivities())
   }, [])

   const onEditActivityClick = (activity: IActivity) => {
      setCurrentActivity(activity)
      setManageModal(true)
   }

   const onDeleteActivityClick = (activityId: string) => {
      setDeleteModal(null)
      dispatch(deleteActivity(activityId))
   }

   return (
      <>
         {manageModal
            && <Modal title={!currentActivity ? 'Creating a new activity' : 'Updating an activity'} onCloseModal={() => {
               setManageModal(false)
               setCurrentActivity(null)
            }}>
               <ActivityManageForm currentActivity={currentActivity} afterSubmitHandler={() => {
                  setCurrentActivity(null)
                  setManageModal(false)
               }} />
            </Modal>}

         {deleteModal
            && <Modal title='Deleting activity' onCloseModal={() => setDeleteModal(null)}>
               <Button onClick={() => onDeleteActivityClick(deleteModal)}>Delete activity</Button>
            </Modal>}

         {createSessionModal
            && <Modal title='Starting new session' onCloseModal={() => setCreateSessionModal(null)}>
               <SessionCreateForm defaultActivity={createSessionModal} afterSubmitHandler={() => {
                  navigate('/timer')
               }} />
            </Modal>}

         <div className='container flex justify-between'>
            <div>
               <div className='mb-5 text-xl font-bold'>All activities</div>
               <div className='flex flex-col gap-4'>
                  {activities.map((activity: IActivity) => (
                     <ActivityItem key={activity.id} activity={activity} editHandler={onEditActivityClick}
                        deleteHandler={setDeleteModal} startSessionHandler={() => setCreateSessionModal(activity.id)} />
                  ))}
               </div>
            </div>

            <div className='flex gap-5 h-full'>
               <Button onClick={() => { }}>Search...</Button>
               <Button onClick={() => setManageModal(true)}>Create new activity</Button>
            </div>
         </div>
      </>
   )
}

export default ActivitiesPage