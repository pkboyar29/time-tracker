import { FC, useEffect, useState } from 'react'
import audioUrl from '../assets/audio.mp3'
import { fetchSessions, updateSession, deleteSession, setCurrentSessionById, removeCurrentSession, addSecond } from '../redux/slices/sessionSlice'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../redux/store'
import { getRemainingTimeMinutesSeconds } from '../utils/timerHelpers'

import SessionCreateForm from '../components/forms/SessionCreateForm'
import Button from '../components/Button'
import Modal from '../components/Modal'

const TimerPage: FC = () => {
   const [enabled, setEnabled] = useState<boolean>(false)
   const sessions = useSelector((state: RootState) => state.sessions.sessions)
   const currentSession = useSelector((state: RootState) => state.sessions.currentSession)
   const dispatch = useDispatch<AppDispatch>()

   const [createModal, setCreateModal] = useState<boolean>(false)
   const [deleteModal, setDeleteModal] = useState<string | null>(null) // we store here id of session we want to delete or null

   useEffect(() => {
      dispatch(fetchSessions())
   }, [])

   const toggleTimer = () => {
      setEnabled((e) => !e)
      if (enabled) {
         if (currentSession) {
            dispatch(updateSession(currentSession))
         }
      }
   }

   const startTimer = () => {
      setEnabled(true)
   }

   const stopTimer = () => {
      setEnabled(false)
      dispatch(removeCurrentSession())
      if (currentSession) {
         dispatch(updateSession(currentSession))
      }
   }

   useEffect(() => {
      if (!enabled)
         return
      const intervalId = setInterval(() => {
         dispatch(addSecond())
      }, 1000)
      return () => {
         clearInterval(intervalId)
      }
   }, [enabled])

   useEffect(() => {
      if (currentSession) {
         if (currentSession.spentTimeSeconds === currentSession.totalTimeSeconds) {
            const audio = new Audio(audioUrl)
            audio.volume = 0.35
            audio.play()
            // alert('Count down')
            stopTimer()
         }
      }
   }, [currentSession?.spentTimeSeconds])

   const onSessionClick = (sessionId: string) => {
      dispatch(setCurrentSessionById(sessionId))
      setEnabled(true)
   }

   const onDeleteSessionClick = (sessionId: string) => {
      if (currentSession?.id === sessionId) {
         dispatch(removeCurrentSession())
         stopTimer()
      }
      setDeleteModal(null)
      dispatch(deleteSession(sessionId))
   }

   return (
      <>
         {createModal &&
            <Modal title='Creating new session' onCloseModal={() => setCreateModal(false)}>
               <SessionCreateForm afterSubmitHandler={() => {
                  startTimer()
                  setCreateModal(false)
               }} />
            </Modal>}

         {deleteModal &&
            <Modal title='Deleting session' onCloseModal={() => setDeleteModal(null)}>
               <button onClick={() => onDeleteSessionClick(deleteModal)} className='p-3 bg-red-500 text-white rounded-xl'>Delete session</button>
            </Modal>}

         <div className='container flex justify-between'>
            <div>
               <div className='mb-5 text-xl font-bold'>All sessions</div>
               <div className='inline-flex flex-col gap-2'>
                  {sessions.map((session: Session) => (
                     <div key={session.id} className='flex items-center gap-4'>
                        <div onClick={() => onSessionClick(session.id)} className='flex gap-3'>
                           <div>{session.id}</div>
                           <div>{Math.round(session.totalTimeSeconds / 60)} min</div>
                           <div>{Math.round(session.spentTimeSeconds / 60)} min</div>
                           <div>{session.activity ? session.activity : 'without activity'}</div>
                           <div>{session.completed ? 'completed' : 'not completed'}</div>
                        </div>
                        <button onClick={() => setDeleteModal(session.id)} className='ml-auto'><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                     </div>
                  ))}
               </div>
            </div>
            <div>
               <Button onClick={() => setCreateModal(true)}>Create new session</Button>
            </div>
         </div>

         <div className='flex items-center justify-center mt-60'>
            {!currentSession
               ? (<div className='text-2xl font-semibold'>Choose existing session or create a new one</div>)
               : (<div className='flex flex-col items-center gap-3'>
                  <div>id {currentSession.id}</div>
                  <div>Session {Math.round(currentSession.totalTimeSeconds / 60)} minutes</div>
                  <div>
                     Left: {getRemainingTimeMinutesSeconds(currentSession.totalTimeSeconds, currentSession.spentTimeSeconds)}
                  </div>
                  <div className='flex gap-4'>
                     <button onClick={toggleTimer}>
                        {(enabled ? (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /></svg>)
                           : (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5V18M15 7.5V18M3 16.811V8.69c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811Z" /></svg>))}
                     </button>
                     <button onClick={stopTimer}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" /></svg>
                     </button>
                  </div>
               </div>
               )}
         </div>
      </>
   )
}

export default TimerPage