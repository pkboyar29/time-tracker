import { useEffect, useState } from 'react'
import { get, useForm } from 'react-hook-form'
import audioUrl from './assets/audio.mp3'
import { fetchSessions, createSession, setCurrentSessionById } from './redux/slices/sessionSlice'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from './redux/store'
import { PauseCircleIcon, PlayCircleIcon, StopCircleIcon, PlayPauseIcon } from '@heroicons/react/24/solid';

interface SessionFields {
  spentTimeSeconds: number
}

function App() {
  const [started, setStarted] = useState<boolean>(false)
  const [enabled, setEnabled] = useState<boolean>(false)
  const [countDown, setCountDown] = useState<number>(0)
  const sessions = useSelector((state: RootState) => state.sessions.sessions)
  const currentSession = useSelector((state: RootState) => state.sessions.currentSession)

  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(fetchSessions())
  }, [])

  const { register, getValues } = useForm<SessionFields>({ mode: 'onBlur' })

  const toggleTimer = () => {
    setEnabled((e) => !e)
  }

  const startTimer = () => {
    setCountDown(getValues('spentTimeSeconds'))
    setStarted(true)
    toggleTimer()
  }

  const stopTimer = () => {
    setStarted(false)
    setEnabled(false)
    setCountDown(getValues('spentTimeSeconds'))
  }

  useEffect(() => {
    if (!enabled)
      return
    const intervalId = setInterval(() => {
      setCountDown((c) => Math.max(c - 1, 0))
    }, 1000)
    return () => {
      clearInterval(intervalId)
    }
  }, [enabled])

  useEffect(() => {
    if (countDown === 0) {
      const audio = new Audio(audioUrl)
      audio.volume = 0.35
      audio.play()
      // alert('Count down')
      stopTimer()
    }
  }, [countDown])

  const onSessionClick = (sessionId: string) => {
    console.log(sessionId)
    dispatch(setCurrentSessionById(sessionId))
  }

  const onCreateSessionClick = () => {
    dispatch(createSession({
      totalTimeSeconds: getValues('spentTimeSeconds'),
      spentTimeSeconds: 0
    }))
  }

  return (
    <>
      <div>
        <div>Все сессии</div>
        <div className='mt-3 flex flex-col gap-2'>
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

      <div className='flex flex-col items-center gap-3 mt-10'>
        <div>Сессия {currentSession?.totalTimeSeconds} секунд</div>
        <div>Прошло: {currentSession?.spentTimeSeconds} секунд</div>
        <div className='flex gap-4'>
          <button onClick={() => {
            if (!started)
              startTimer()
            else
              toggleTimer()
          }}>{!started ? (<PlayCircleIcon className='size-6 text-red-500' />)
            : (enabled ? (<PauseCircleIcon className='size-6 text-red-500' />) : (<PlayPauseIcon className='size-6 text-red-500' />))}</button>
          {(started) && (<button onClick={stopTimer}><StopCircleIcon className='size-6 text-red-500' /></button>)}
        </div>
      </div>
    </>
  )
}

export default App