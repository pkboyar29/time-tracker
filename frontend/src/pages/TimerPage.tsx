import { FC, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import audioUrl from '../assets/audio.mp3'
import { fetchSessions, createSession, updateSession, setCurrentSessionById, removeCurrentSession, addSecond } from '../redux/slices/sessionSlice'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../redux/store'

interface SessionFields {
   spentTimeSeconds: number
}

const TimerPage: FC = () => {
   const [enabled, setEnabled] = useState<boolean>(false)
   const sessions = useSelector((state: RootState) => state.sessions.sessions)
   const currentSession = useSelector((state: RootState) => state.sessions.currentSession)

   const dispatch = useDispatch<AppDispatch>()

   useEffect(() => {
      dispatch(fetchSessions())
   }, [])

   const { register, getValues } = useForm<SessionFields>({ mode: 'onBlur' })

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
      console.log(sessionId)
      dispatch(setCurrentSessionById(sessionId))
      setEnabled(true)
   }

   const onCreateSessionClick = () => {
      dispatch(createSession({
         totalTimeSeconds: getValues('spentTimeSeconds'),
         spentTimeSeconds: 0
      }))
      startTimer()
   }

   return (
      <>
         <div>
            <div>Все сессии</div>
            <div className='mt-3 inline-flex flex-col gap-2'>
               {sessions.map((session: Session) => (
                  <div onClick={() => {
                     if (session.id) {
                        onSessionClick(session.id)
                     }
                  }} key={session.id} className='flex gap-3'>
                     <div>{session.id}</div>
                     <div>{session.totalTimeSeconds} сек</div>
                     <div>{session.spentTimeSeconds} сек</div>
                     <div>{session.completed ? 'completed' : 'not completed'}</div>
                  </div>
               ))}
            </div>
         </div>

         <div className='mt-8 flex flex-col items-start gap-3'>
            <div>Creating a new session</div>
            <input {...register('spentTimeSeconds')} type='number' placeholder='Enter seconds' className='p-1 rounded-md border border-sky-500 bg-red-500 text-white placeholder-white' />
            <div>Choose an activity</div>
            <div>Choose a task</div>
            <button className='p-3 bg-red-500 text-white rounded-xl' onClick={onCreateSessionClick}
            >Create session</button>
         </div>

         <div className='flex justify-center mt-10'>
            {!currentSession
               ? (<>Выберите существующую сессию или создайте новую</>)
               : (<div className='flex flex-col items-center gap-3'>
                  <div>id {currentSession?.id}</div>
                  <div>Сессия {currentSession?.totalTimeSeconds} секунд</div>
                  <div>Прошло: {currentSession?.spentTimeSeconds} секунд</div>
                  <div className='flex gap-4'>
                     <button onClick={toggleTimer}>
                        {(enabled ? (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /></svg>)
                           : (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5V18M15 7.5V18M3 16.811V8.69c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811Z" /></svg>))}
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