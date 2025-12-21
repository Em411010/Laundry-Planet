import { useState } from 'react'
import { Route, Routes } from 'react-router'

import LandingPage from './pages/public/LandingPage'


function App() {


  return (
    <>
      <div>
        <Routes>
          <Route path='/' element={<LandingPage />} />
        </Routes>
      
      </div>
    </>
  )
}

export default App
