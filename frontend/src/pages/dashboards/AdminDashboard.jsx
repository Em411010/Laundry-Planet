import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminSidebar, AdminNavbar } from '../../components/navbars/AdminNavbar'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      navigate('/login')
    }
  }, [navigate])

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  if (!user) return null

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <AdminSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <AdminNavbar toggleSidebar={toggleSidebar} />

      <div className="lg:ml-64 pt-20 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="card bg-base-100 shadow-xl mt-12">
            <div className="card-body items-center text-center">
              <h2 className="card-title text-3xl mb-4">Welcome, {user.firstName}!</h2>
              <p className="text-lg text-base-content/70 mb-6">Admin Dashboard</p>
              
              <div className="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="font-semibold">Still Under Development</span>
              </div>

              <div className="mt-8 text-base-content/60">
                <p>Your admin portal is being built with powerful features:</p>
                <ul className="list-disc list-inside mt-4 space-y-2">
                  <li>Manage all users and roles</li>
                  <li>View system analytics</li>
                  <li>Configure pricing and services</li>
                  <li>Monitor all operations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
