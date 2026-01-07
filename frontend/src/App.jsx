import { useState } from 'react'
import { Route, Routes } from 'react-router'

import SplashScreen from './pages/public/SplashScreen'
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import ClientDashboard from './pages/dashboards/ClientDashboard'
import StaffDashboard from './pages/dashboards/StaffDashboard'
import AdminDashboard from './pages/dashboards/AdminDashboard'


function App() {


  return (
    <>
      <div>
        <Routes>
          <Route path='/' element={<SplashScreen />} />
          <Route path='/landing' element={<LandingPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route path='/dashboard/client' element={<ClientDashboard />} />
          <Route path='/dashboard/staff' element={<StaffDashboard />} />
          <Route path='/dashboard/admin' element={<AdminDashboard />} />
        </Routes>
      
      </div>
    </>
  )
}

export default App
