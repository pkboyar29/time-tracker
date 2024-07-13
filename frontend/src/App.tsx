import { FC } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import TimerPage from './pages/TimerPage'


const App: FC = () => {
  return (
    <>
      <Routes>
        <Route path='/timer' element={<TimerPage />} />
        <Route path='/' element={<Navigate to='/timer' />} />
      </Routes>
    </>
  )
}

export default App