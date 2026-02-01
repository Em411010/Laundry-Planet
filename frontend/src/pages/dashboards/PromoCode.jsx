import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminSidebar, AdminNavbar } from '../../components/navbars/AdminNavbar'
import { Tag, Clock, Sparkles } from 'lucide-react'

const PromoCode = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== 'admin') {
        navigate('/login')
        return
      }
      setUser(parsedUser)
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

      <div className="lg:ml-64 pt-32 mt-12 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="card bg-base-100 shadow-xl mt-12">
            <div className="card-body items-center text-center">
              <div className="mb-6">
                <Tag className="h-24 w-24 text-primary mx-auto mb-4" />
                <Sparkles className="h-12 w-12 text-accent mx-auto animate-pulse" />
              </div>

              <h2 className="card-title text-4xl mb-4">Promo Codes</h2>
              <p className="text-2xl font-semibold text-primary mb-6">Coming Soon!</p>
              
              <div className="alert alert-info max-w-2xl">
                <Clock className="h-6 w-6" />
                <div className="text-left">
                  <h3 className="font-bold">Wait for Further Announcement</h3>
                  <div className="text-sm">
                    The Promo Code management feature is currently under development. 
                    Stay tuned for exciting promotional features!
                  </div>
                </div>
              </div>

              <div className="mt-8 text-base-content/60 max-w-xl">
                <p className="mb-4">Once available, you'll be able to:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Create discount codes for customers</li>
                  <li>Set percentage or fixed amount discounts</li>
                  <li>Define expiration dates and usage limits</li>
                  <li>Track promo code performance</li>
                  <li>Manage active and expired promotions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PromoCode
