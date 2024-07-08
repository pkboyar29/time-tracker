import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import audioUrl from './assets/audio.mp3'

interface SessionFields {
  spentTimeSeconds: number
}

function App() {
  const [started, setStarted] = useState<boolean>(false)
  const [enabled, setEnabled] = useState<boolean>(false)
  const [countDown, setCountDown] = useState<number>(0)

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
        <input {...register('spentTimeSeconds')} type='number' placeholder='Enter seconds' className='p-1 rounded-md' />
        <div className=''>{countDown}</div>
        <div className='mt-3 flex justify-center gap-4'>
          <button onClick={() => {
            if (!started)
              startTimer()
            else
              toggleTimer()
          }}>{!started ? 'Start' : (enabled ? 'Stop' : 'Continue')}</button>
          {(started) && (<button onClick={stopTimer}>Reset</button>)}
        </div>
      </div>
    </>
  )
}

export default App
