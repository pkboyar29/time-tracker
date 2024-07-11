import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import audioUrl from './assets/audio.mp3'
import { fetchSessions, createSession } from './redux/slices/sessionSlice'
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
    const i = setInterval(() => {
      setCountDown((c) => Math.max(c - 1, 0))
    }, 1000)
    return () => {
      clearInterval(i)
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

  return (
    <>
      <div>
        <div>Все сессии</div>
        <div>
          {sessions.map((session, index) => (
            <div key={index} className='flex gap-3'>
              <div>{session._id}</div>
              <div>{session.totalTimeSeconds} сек</div>
              <div>{session.spentTimeSeconds} сек</div>
              <div>{session.completed ? 'completed' : 'not completed'}</div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => {
        dispatch(createSession({
          totalTimeSeconds: 7200,
          spentTimeSeconds: 0
        }))
      }}>Create session</button>

      <div className='flex flex-col items-center gap-1 mt-10'>
        <input {...register('spentTimeSeconds')} type='number' placeholder='Enter seconds' className='p-1 rounded-md border border-sky-500 bg-sky-200' />
        <div className=''>{countDown}</div>
        <div className='mt-3 flex gap-4'>
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