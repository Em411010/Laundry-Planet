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
import UserManagement from './pages/dashboards/UserManagement'
import ServicesPricing from './pages/dashboards/ServicesPricing'
import PromoCode from './pages/dashboards/PromoCode'
import AuditLogs from './pages/dashboards/AuditLogs'
import ClientProfile from './pages/dashboards/ClientProfile'
import ClientSupportChat from './pages/dashboards/ClientSupportChat'
import AdminSupportChat from './pages/dashboards/AdminSupportChat'
import AdminOrders from './pages/dashboards/AdminOrders'
import NewOrder from './pages/dashboards/NewOrder'
import TrackOrders from './pages/dashboards/TrackOrders'
import OrderHistory from './pages/dashboards/OrderHistory'
import Receipts from './pages/dashboards/Receipts'
import StaffOrders from './pages/dashboards/StaffOrders'
import MyTasks from './pages/dashboards/MyTasks'
import StaffWalkInOrder from './pages/dashboards/StaffWalkInOrder'
import AdminWalkInOrder from './pages/dashboards/AdminWalkInOrder'
import SalesReport from './pages/dashboards/SalesReport'
import CustomerReport from './pages/dashboards/CustomerReport'
import ServiceReport from './pages/dashboards/ServiceReport'
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
