import { useState } from 'react'
import { Route, Routes } from 'react-router'

import SplashScreen from './pages/public/SplashScreen'
import LandingPage from './pages/public/LandingPage'
import HowItWorksPage from './pages/public/HowItWorksPage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import VerifyOTPPage from './pages/public/VerifyOTPPage'
import ForgotPasswordPage from './pages/public/ForgotPasswordPage'
import ClientDashboard from './pages/dashboards/ClientDashboard'
import StaffDashboard from './pages/dashboards/StaffDashboard'
import AdminDashboard from './pages/dashboards/AdminDashboard'
import UserManagement from './pages/UserManagement'
import ServicesPricing from './pages/ServicesPricing'
import PromoCode from './pages/PromoCode'
import AuditLogs from './pages/AuditLogs'
import ClientProfile from './pages/ClientProfile'
import ClientSupportChat from './pages/ClientSupportChat'
import AdminSupportChat from './pages/AdminSupportChat'
import AdminOrders from './pages/AdminOrders'
import NewOrder from './pages/NewOrder'
import TrackOrders from './pages/TrackOrders'
import OrderHistory from './pages/OrderHistory'
import Receipts from './pages/Receipts'
import StaffOrders from './pages/StaffOrders'
import MyTasks from './pages/MyTasks'
import StaffWalkInOrder from './pages/StaffWalkInOrder'
import AdminWalkInOrder from './pages/AdminWalkInOrder'
import SalesReport from './pages/SalesReport'
import CustomerReport from './pages/CustomerReport'
import ServiceReport from './pages/ServiceReport'
import PaymentSuccess from './pages/payment/PaymentSuccess'
import PaymentFailed from './pages/payment/PaymentFailed'


function App() {


  return (
    <>
      <div>
        <Routes>
          <Route path='/' element={<SplashScreen />} />
          <Route path='/landing' element={<LandingPage />} />
          <Route path='/how-it-works' element={<HowItWorksPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route path='/verify-otp' element={<VerifyOTPPage />} />
          <Route path='/forgot-password' element={<ForgotPasswordPage />} />
          <Route path='/dashboard/client' element={<ClientDashboard />} />
          <Route path='/dashboard/client/profile' element={<ClientProfile />} />
          <Route path='/dashboard/client/support' element={<ClientSupportChat />} />
          <Route path='/dashboard/client/new-order' element={<NewOrder />} />
          <Route path='/dashboard/client/track-orders' element={<TrackOrders />} />
          <Route path='/dashboard/client/orders/history' element={<OrderHistory />} />
          <Route path='/dashboard/client/receipts' element={<Receipts />} />
          <Route path='/dashboard/staff' element={<StaffDashboard />} />
          <Route path='/dashboard/staff/orders' element={<StaffOrders />} />
          <Route path='/dashboard/staff/my-tasks' element={<MyTasks />} />
          <Route path='/dashboard/staff/payments' element={<StaffWalkInOrder />} />
          <Route path='/dashboard/admin' element={<AdminDashboard />} />
          <Route path='/dashboard/admin/users' element={<UserManagement />} />
          <Route path='/dashboard/admin/services' element={<ServicesPricing />} />
          <Route path='/dashboard/admin/promos' element={<PromoCode />} />
          <Route path='/dashboard/admin/support' element={<AdminSupportChat />} />
          <Route path='/dashboard/admin/orders' element={<AdminOrders />} />
          <Route path='/dashboard/admin/orders/pending' element={<AdminOrders />} />
          <Route path='/dashboard/admin/orders/completed' element={<AdminOrders />} />
          <Route path='/dashboard/admin/walk-in-order' element={<AdminWalkInOrder />} />
          <Route path='/dashboard/admin/audit-logs' element={<AuditLogs />} />
          <Route path='/dashboard/admin/reports/sales' element={<SalesReport />} />
          <Route path='/dashboard/admin/reports/customers' element={<CustomerReport />} />
          <Route path='/dashboard/admin/reports/services' element={<ServiceReport />} />
          <Route path='/payment/success' element={<PaymentSuccess />} />
          <Route path='/payment/failed' element={<PaymentFailed />} />
        </Routes>
      
      </div>
    </>
  )
}

export default App
