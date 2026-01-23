import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminSidebar, AdminNavbar } from '../../components/navbars/AdminNavbar'
import { dashboardAPI } from '../../services/api'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartPeriod, setChartPeriod] = useState('7days') // '7days' or '30days'

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      navigate('/login')
    }
  }, [navigate])

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const data = await dashboardAPI.getAdminStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <AdminSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <AdminNavbar toggleSidebar={toggleSidebar} />

      <div className="lg:ml-64 pt-20 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
        
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-base-content">Dashboard Overview</h1>
            <p className="text-base-content/70 mt-2">Welcome back, {user.firstName}!</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <>
          
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
               
                <div className="card bg-gradient-to-br from-primary to-primary-focus text-primary-content shadow-xl">
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-primary-content/80 text-sm">Total Revenue</p>
                        <h3 className="text-2xl font-bold mt-2">
                          {formatCurrency(stats?.keyMetrics?.totalRevenue || 0)}
                        </h3>
                        <p className="text-sm mt-2 text-primary-content/90">
                          Avg: {formatCurrency(stats?.keyMetrics?.avgOrderValue || 0)}/order
                        </p>
                      </div>
                      <div className="bg-primary-content/20 p-3 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

              
                <div className="card bg-gradient-to-br from-secondary to-secondary-focus text-secondary-content shadow-xl">
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-secondary-content/80 text-sm">Total Orders</p>
                        <h3 className="text-2xl font-bold mt-2">{stats?.keyMetrics?.totalOrders || 0}</h3>
                        <p className="text-sm mt-2 text-secondary-content/90">
                          Today: {stats?.keyMetrics?.ordersToday || 0}
                        </p>
                      </div>
                      <div className="bg-secondary-content/20 p-3 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

            
                <div className="card bg-gradient-to-br from-accent to-accent-focus text-accent-content shadow-xl">
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-accent-content/80 text-sm">Total Users</p>
                        <h3 className="text-2xl font-bold mt-2">{stats?.keyMetrics?.totalUsers || 0}</h3>
                        <p className="text-sm mt-2 text-accent-content/90">
                          New this month: {stats?.keyMetrics?.newUsersThisMonth || 0}
                        </p>
                      </div>
                      <div className="bg-accent-content/20 p-3 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

  
                <div className="card bg-gradient-to-br from-warning to-warning-focus text-warning-content shadow-xl">
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-warning-content/80 text-sm">Pending Tasks</p>
                        <h3 className="text-2xl font-bold mt-2">{stats?.keyMetrics?.pendingTasks || 0}</h3>
                        <p className="text-sm mt-2 text-warning-content/90">Requires attention</p>
                      </div>
                      <div className="bg-warning-content/20 p-3 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
     
                <div className="lg:col-span-2 card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="card-title">Revenue Trends</h2>
                      <div className="btn-group">
                        <button 
                          className={`btn btn-sm ${chartPeriod === '7days' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setChartPeriod('7days')}
                        >
                          7 Days
                        </button>
                        <button 
                          className={`btn btn-sm ${chartPeriod === '30days' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setChartPeriod('30days')}
                        >
                          30 Days
                        </button>
                      </div>
                    </div>

                    <div className="h-64 flex items-end justify-around gap-2">
                      {(chartPeriod === '7days' 
                        ? stats?.revenueChart?.last7Days || []
                        : stats?.revenueChart?.last30Days || []
                      )?.map((item, index) => {
                        const chartData = chartPeriod === '7days' 
                          ? stats?.revenueChart?.last7Days || []
                          : stats?.revenueChart?.last30Days || []
                        const maxRevenue = Math.max(...chartData.map(i => i.revenue), 0)
                        const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 5
                        return (
                          <div key={index} className="flex flex-col items-center flex-1">
                            <div 
                              className="w-full bg-primary rounded-t-lg tooltip tooltip-top" 
                              data-tip={`${formatCurrency(item.revenue)}`}
                              style={{ height: `${height}%`, minHeight: '4px' }}
                            ></div>
                            <p className="text-xs mt-2 text-base-content/60">{formatDate(item.date)}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

              
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title mb-4">Quick Stats</h2>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-base-content/70">This Month</span>
                        <span className="font-bold">{formatCurrency(stats?.quickStats?.thisMonthRevenue || 0)}</span>
                      </div>
                      <div className="divider my-0"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-base-content/70">This Week</span>
                        <span className="font-bold">{formatCurrency(stats?.quickStats?.thisWeekRevenue || 0)}</span>
                      </div>
                      <div className="divider my-0"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-base-content/70">Last Month</span>
                        <span className="font-bold">{formatCurrency(stats?.quickStats?.lastMonthRevenue || 0)}</span>
                      </div>
                      <div className="divider my-0"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-base-content/70">Growth</span>
                        <span className={`font-bold ${
                          (stats?.quickStats?.revenueGrowth || 0) >= 0 ? 'text-success' : 'text-error'
                        }`}>
                          {(stats?.quickStats?.revenueGrowth || 0) >= 0 ? '+' : ''}
                          {(stats?.quickStats?.revenueGrowth || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="divider my-0"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-base-content/70">Most Popular</span>
                        <span className="font-bold text-sm">
                          {stats?.quickStats?.mostPopularService?.name || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

             
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                <div className="lg:col-span-2 card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="card-title">Recent Orders</h2>
                      <button 
                        className="btn btn-sm btn-ghost"
                        onClick={() => navigate('/dashboard/admin/orders')}
                      >
                        View All
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="table table-zebra">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Status</th>
                            <th>Amount</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats?.recentActivity?.map((order) => (
                            <tr key={order._id}>
                              <td className="font-mono text-sm">{order.orderNumber}</td>
                              <td>{order.customer?.firstName} {order.customer?.lastName}</td>
                              <td>
                                <div className={`badge ${
                                  order.status === 'completed' ? 'badge-success' :
                                  order.status === 'cancelled' ? 'badge-error' :
                                  order.status === 'pending' ? 'badge-warning' :
                                  'badge-info'
                                }`}>
                                  {order.status}
                                </div>
                              </td>
                              <td className="font-semibold">{formatCurrency(order.totalPrice)}</td>
                              <td className="text-sm text-base-content/70">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                          {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                            <tr>
                              <td colSpan="5" className="text-center text-base-content/50">
                                No recent orders
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

               
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title mb-4">Staff Overview</h2>
                    <div className="space-y-4">
                      <div className="stat bg-base-200 rounded-lg">
                        <div className="stat-title">Active Staff</div>
                        <div className="stat-value text-primary">{stats?.staffOverview?.activeStaff || 0}</div>
                        <div className="stat-desc">Currently active</div>
                      </div>
                      <div className="stat bg-base-200 rounded-lg">
                        <div className="stat-title">Total Staff</div>
                        <div className="stat-value text-secondary">{stats?.staffOverview?.totalStaff || 0}</div>
                        <div className="stat-desc">All staff members</div>
                      </div>
                      <button 
                        className="btn btn-primary btn-block mt-4"
                        onClick={() => navigate('/dashboard/admin/users')}
                      >
                        Manage Staff
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="card-title">Recent Feedback</h2>
                      <button 
                        className="btn btn-sm btn-ghost"
                        onClick={() => navigate('/dashboard/admin/feedback')}
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-3">
                      {stats?.recentFeedback?.map((feedback, index) => (
                        <div key={index} className="alert shadow-sm">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`badge badge-sm ${
                                feedback.messageType === 'complaint' ? 'badge-error' :
                                feedback.messageType === 'issue' ? 'badge-warning' :
                                'badge-info'
                              }`}>
                                {feedback.messageType}
                              </div>
                              <span className="text-sm font-semibold">
                                {feedback.customer?.firstName} {feedback.customer?.lastName}
                              </span>
                            </div>
                            <p className="text-sm text-base-content/70 line-clamp-2">
                              {feedback.content}
                            </p>
                            <p className="text-xs text-base-content/50 mt-1">
                              Order: {feedback.orderNumber}
                            </p>
                          </div>
                        </div>
                      ))}
                      {(!stats?.recentFeedback || stats.recentFeedback.length === 0) && (
                        <div className="text-center text-base-content/50 py-4">
                          No recent feedback
                        </div>
                      )}
                    </div>
                  </div>
                </div>

               
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        className="btn btn-outline btn-primary"
                        onClick={() => navigate('/dashboard/admin/users')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Users
                      </button>
                      <button 
                        className="btn btn-outline btn-secondary"
                        onClick={() => navigate('/dashboard/admin/services')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        Services
                      </button>
                      <button 
                        className="btn btn-outline btn-accent"
                        onClick={() => navigate('/dashboard/admin/orders')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Orders
                      </button>
                      <button 
                        className="btn btn-outline btn-info"
                        onClick={() => navigate('/dashboard/admin/audit-logs')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Audit Logs
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
