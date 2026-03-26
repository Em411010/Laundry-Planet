import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { StaffSidebar, StaffNavbar } from '../../components/navbars/StaffNavbar'
import { orderAPI } from '../../services/api'
import { useSocket } from '../../contexts/SocketContext'

const StaffDashboard = () => {
  const navigate = useNavigate()
  const { socket, isConnected } = useSocket()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
      fetchAnalytics()
    } else {
      navigate('/login')
    }
  }, [navigate])

  // Setup real-time notifications for staff
  useEffect(() => {
    if (isConnected && user) {
      // Listen for new task assignments
      socket.onNewTask((data) => {
        console.log('New task assigned:', data);
        // Refresh analytics
        fetchAnalytics();
      });

      // Listen for new orders
      socket.onNewOrder((data) => {
        console.log('New order received:', data);
        fetchAnalytics();
      });

      // Cleanup
      return () => {
        socket.removeAllListeners('staff:newTask');
        socket.removeAllListeners('order:new');
      };
    }
  }, [isConnected, user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await orderAPI.getStaffAnalytics()
      if (response.success) {
        setAnalytics(response.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Unable to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: 'badge-warning',
      accepted: 'badge-info',
      'picked-up': 'badge-primary',
      'in-progress': 'badge-secondary',
      'ready-for-delivery': 'badge-accent',
      'out-for-delivery': 'badge-info',
      delivered: 'badge-success',
      cancelled: 'badge-error',
      completed: 'badge-success'
    }
    return colors[status] || 'badge-ghost'
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      Pickup: 'bg-blue-500 text-white',
      Processing: 'bg-purple-500 text-white',
      Delivery: 'bg-green-500 text-white',
      Staff: 'badge-ghost'
    }
    return colors[role] || 'badge-ghost'
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <StaffSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <StaffNavbar toggleSidebar={toggleSidebar} />

    
      <div className="lg:ml-64 pt-28 md:pt-32 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title text-3xl">Welcome, {user.firstName}!</h2>
              <p className="text-base-content/70">Here's your performance overview</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : analytics ? (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4 px-2">Quick Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-80">Total Books</p>
                          <p className="text-3xl font-bold">{analytics.orderCounts.allTime}</p>
                          <p className="text-xs opacity-70 mt-1">All Time</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-80">This Month</p>
                          <p className="text-3xl font-bold">{analytics.orderCounts.thisMonth}</p>
                          <p className="text-xs opacity-70 mt-1">Books</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-80">Today's Tasks</p>
                          <p className="text-3xl font-bold">{analytics.orderCounts.today}</p>
                          <p className="text-xs opacity-70 mt-1">Books</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-80">Pending Tasks</p>
                          <p className="text-3xl font-bold">{analytics.orderCounts.pending}</p>
                          <p className="text-xs opacity-70 mt-1">In Progress</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4 px-2">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => navigate('/dashboard/staff/orders?tab=myTasks')}
                    className="btn btn-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none hover:from-blue-600 hover:to-blue-700 shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    My Tasks
                  </button>

                  <button 
                    onClick={() => navigate('/dashboard/staff/orders?tab=waitingToAccept')}
                    className="btn btn-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white border-none hover:from-purple-600 hover:to-purple-700 shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Waiting to Accept
                  </button>

                  <button 
                    onClick={() => navigate('/dashboard/staff/orders?tab=all')}
                    className="btn btn-lg bg-gradient-to-r from-green-500 to-green-600 text-white border-none hover:from-green-600 hover:to-green-700 shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    All Books
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h3 className="text-xl font-bold mb-4">Weekly Performance</h3>
                    <div className="flex items-end justify-between h-64 gap-2">
                      {analytics.weeklyData.map((day, index) => {
                        const maxKg = Math.max(...analytics.weeklyData.map(d => d.kg), 1)
                        const heightPercent = (day.kg / maxKg) * 100
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <div className="relative w-full group">
                              <div 
                                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                                style={{ height: `${heightPercent}%`, minHeight: day.kg > 0 ? '20px' : '5px' }}
                              >
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {day.kg.toFixed(2)} kg
                                </div>
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold">{day.day}</p>
                              <p className="text-xs text-base-content/60">{day.kg.toFixed(1)} kg</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                    <div className="overflow-x-auto">
                      <table className="table table-zebra">
                        <thead>
                          <tr>
                            <th>Book ID</th>
                            <th>Customer</th>
                            <th>Weight</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.recentActivity.length > 0 ? (
                            analytics.recentActivity.map((activity, index) => (
                              <tr key={index} className="hover">
                                <td className="font-semibold">{activity.orderId}</td>
                                <td>{activity.customer}</td>
                                <td>{activity.actualWeight.toFixed(2)} kg</td>
                                <td>
                                  <span className={`badge ${getStatusBadgeColor(activity.status)} badge-sm`}>
                                    {activity.status}
                                  </span>
                                </td>
                                <td className="text-sm text-base-content/70">
                                  {new Date(activity.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="text-center text-base-content/60">
                                No recent activity
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-4 px-2">{analytics.month}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-base-content/60">Pickup</h3>
                          <p className="text-3xl font-bold mt-1">{analytics.monthly.pickup.toFixed(2)} kg</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-base-content/60">Processing</h3>
                          <p className="text-3xl font-bold mt-1">{analytics.monthly.processing.toFixed(2)} kg</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-base-content/60">Delivery</h3>
                          <p className="text-3xl font-bold mt-1">{analytics.monthly.delivery.toFixed(2)} kg</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-4 px-2">All Time</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card bg-base-100 shadow-xl border-2 border-blue-200">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-base-content/60">Total Pickup</h3>
                          <p className="text-3xl font-bold mt-1">{analytics.overall.pickup.toFixed(2)} kg</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card bg-base-100 shadow-xl border-2 border-purple-200">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-base-content/60">Total Processing</h3>
                          <p className="text-3xl font-bold mt-1">{analytics.overall.processing.toFixed(2)} kg</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card bg-base-100 shadow-xl border-2 border-green-200">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-base-content/60">Total Delivery</h3>
                          <p className="text-3xl font-bold mt-1">{analytics.overall.delivery.toFixed(2)} kg</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard


