import { FC } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import TimerPage from './pages/TimerPage'
import Sidebar from './components/Sidebar'


const App: FC = () => {
  return (
    <>
      <div id='app' className='flex min-h-full h-full w-full'>
        <Sidebar />

        <div className='p-5'>
          <Routes>
            <Route path='/timer' element={<TimerPage />} />
            <Route path='/' element={<Navigate to='/timer' />} />
          </Routes>
        </div>
      </div>
    </>
  )
}

export default App