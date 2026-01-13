import { useState } from 'react'
import { Route, Routes } from 'react-router'

import SplashScreen from './pages/public/SplashScreen'
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import VerifyOTPPage from './pages/public/VerifyOTPPage'
import ClientDashboard from './pages/dashboards/ClientDashboard'
import StaffDashboard from './pages/dashboards/StaffDashboard'
import AdminDashboard from './pages/dashboards/AdminDashboard'
import UserManagement from './pages/dashboards/UserManagement'
import ServicesPricing from './pages/dashboards/ServicesPricing'
import PromoCode from './pages/dashboards/PromoCode'
import AuditLogs from './pages/dashboards/AuditLogs'
import ClientProfile from './pages/dashboards/ClientProfile'
import NewOrder from './pages/dashboards/NewOrder'
import TrackOrders from './pages/dashboards/TrackOrders'
import StaffOrders from './pages/dashboards/StaffOrders'
import MyTasks from './pages/dashboards/MyTasks'


function App() {


  return (
    <>
      <div>
        <Routes>
          <Route path='/' element={<SplashScreen />} />
          <Route path='/landing' element={<LandingPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route path='/verify-otp' element={<VerifyOTPPage />} />
          <Route path='/dashboard/client' element={<ClientDashboard />} />
          <Route path='/dashboard/client/profile' element={<ClientProfile />} />
          <Route path='/dashboard/client/new-order' element={<NewOrder />} />
          <Route path='/dashboard/client/track-orders' element={<TrackOrders />} />
          <Route path='/dashboard/staff' element={<StaffDashboard />} />
          <Route path='/dashboard/staff/orders' element={<StaffOrders />} />
          <Route path='/dashboard/staff/my-tasks' element={<MyTasks />} />
          <Route path='/dashboard/admin' element={<AdminDashboard />} />
          <Route path='/dashboard/admin/users' element={<UserManagement />} />
          <Route path='/dashboard/admin/services' element={<ServicesPricing />} />
          <Route path='/dashboard/admin/promos' element={<PromoCode />} />
          <Route path='/dashboard/admin/audit-logs' element={<AuditLogs />} />
        </Routes>
      
      </div>
    </>
  )
}

export default App
