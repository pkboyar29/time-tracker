import { useEffect, useState } from 'react'
import { get, useForm } from 'react-hook-form'
import audioUrl from './assets/audio.mp3'
import { fetchSessions, createSession, updateSession, setCurrentSessionById, removeCurrentSession, addSecond } from './redux/slices/sessionSlice'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from './redux/store'
import { PauseCircleIcon, StopCircleIcon, PlayPauseIcon } from '@heroicons/react/24/solid';

interface SessionFields {
  spentTimeSeconds: number
}

function App() {
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
                {(enabled ? (<PauseCircleIcon className='size-6 text-red-500' />) : (<PlayPauseIcon className='size-6 text-red-500' />))}
              </button>
              <button onClick={stopTimer}><StopCircleIcon className='size-6 text-red-500' /></button>
            </div>
          </div>
          )}
      </div>
    </>
  )
}

export default App