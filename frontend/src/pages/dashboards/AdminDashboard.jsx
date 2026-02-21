import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminSidebar, AdminNavbar } from '../../components/navbars/AdminNavbar'
import { dashboardAPI, salesAPI } from '../../services/api'
import { useSocket } from '../../contexts/SocketContext'
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users,
  Package,
  Clock,
  CheckCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Activity,
  Star,
  Loader,
  Truck
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']
const STATUS_COLORS = {
  pending: '#f59e0b',
  accepted: '#3b82f6',
  'picked-up': '#06b6d4',
  'in-progress': '#8b5cf6',
  processed: '#22c55e',
  'for-delivery': '#ec4899',
  delivered: '#10b981',
  cancelled: '#ef4444'
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { socket, isConnected } = useSocket()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [salesData, setSalesData] = useState(null)
  const [orderStatusData, setOrderStatusData] = useState([])

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

  useEffect(() => {
    if (user) {
      fetchAllData()
    }
  }, [user])

  // Setup real-time dashboard updates
  useEffect(() => {
    if (isConnected && user) {
      // Join dashboard room for live updates
      socket.joinDashboard()

      // Listen for new orders
      socket.onDashboardNewOrder((data) => {
        console.log('New order received:', data)
        // Refresh dashboard data
        fetchAllData()
      })

      // Listen for order updates
      socket.onDashboardOrderUpdate((data) => {
        console.log('Order updated:', data)
        // Refresh dashboard data
        fetchAllData()
      })

      // Cleanup on unmount
      return () => {
        socket.leaveDashboard()
        socket.removeAllListeners('dashboard:newOrder')
        socket.removeAllListeners('dashboard:orderUpdate')
      }
    }
  }, [isConnected, user])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard stats and sales data in parallel
      const [dashboardData, salesResponse] = await Promise.all([
        dashboardAPI.getAdminStats(),
        salesAPI.getSalesReport({ period: 'month' })
      ])
      
      setStats(dashboardData.data || dashboardData)
      
      if (salesResponse.success) {
        setSalesData(salesResponse.data)
        
        // Prepare order status data for pie chart
        const statusData = [
          { name: 'Delivered', value: salesResponse.data.orderStats.completed, color: STATUS_COLORS.delivered },
          { name: 'Pending', value: salesResponse.data.orderStats.pending, color: STATUS_COLORS.pending },
          { name: 'Cancelled', value: salesResponse.data.orderStats.cancelled, color: STATUS_COLORS.cancelled }
        ].filter(item => item.value > 0)
        setOrderStatusData(statusData)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const getGrowthIndicator = (value) => {
    if (value > 0) {
      return (
        <div className="flex items-center gap-1 text-success">
          <ArrowUpRight size={16} />
          <span className="text-sm font-medium">+{value.toFixed(1)}%</span>
        </div>
      )
    } else if (value < 0) {
      return (
        <div className="flex items-center gap-1 text-error">
          <ArrowDownRight size={16} />
          <span className="text-sm font-medium">{value.toFixed(1)}%</span>
        </div>
      )
    }
    return <span className="text-sm text-base-content/50">No change</span>
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <AdminSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <AdminNavbar toggleSidebar={toggleSidebar} />

      <div className="lg:ml-64 pt-28 md:pt-32 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
        
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/70">
                <Activity className="text-primary-content" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-base-content">Dashboard Overview</h1>
                <p className="text-base-content/60">Welcome back, {user.firstName}! Here's what's happening.</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <Loader className="animate-spin mx-auto mb-3 text-primary" size={40} />
                <p className="text-base-content/60">Loading dashboard...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {/* Total Revenue */}
                <div className="card bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="card-body p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-emerald-100 text-sm font-medium">Total Revenue</p>
                        <h3 className="text-3xl font-bold mt-1">
                          {formatCurrency(salesData?.summary?.totalRevenue || stats?.keyMetrics?.totalRevenue || 0)}
                        </h3>
                        <div className="mt-2 flex items-center gap-2">
                          {getGrowthIndicator(parseFloat(stats?.keyMetrics?.revenueGrowth || 0))}
                          <span className="text-emerald-200 text-xs">vs last month</span>
                        </div>
                      </div>
                      <div className="bg-white/20 p-3 rounded-xl">
                        <DollarSign size={28} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Orders */}
                <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="card-body p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Total Orders</p>
                        <h3 className="text-3xl font-bold mt-1">
                          {salesData?.summary?.totalOrders || stats?.keyMetrics?.totalOrders || 0}
                        </h3>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="badge badge-sm bg-white/20 border-0 text-white">
                            Today: {stats?.keyMetrics?.ordersToday || 0}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white/20 p-3 rounded-xl">
                        <ShoppingCart size={28} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Customers */}
                <div className="card bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="card-body p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-violet-100 text-sm font-medium">Total Customers</p>
                        <h3 className="text-3xl font-bold mt-1">
                          {stats?.keyMetrics?.activeUsers || stats?.keyMetrics?.totalUsers || 0}
                        </h3>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="badge badge-sm bg-white/20 border-0 text-white">
                            +{stats?.quickStats?.newUsersThisMonth || 0} this month
                          </span>
                        </div>
                      </div>
                      <div className="bg-white/20 p-3 rounded-xl">
                        <Users size={28} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending Tasks */}
                <div className="card bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="card-body p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-amber-100 text-sm font-medium">Pending Tasks</p>
                        <h3 className="text-3xl font-bold mt-1">
                          {stats?.keyMetrics?.pendingTasks || salesData?.orderStats?.pending || 0}
                        </h3>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="badge badge-sm bg-white/20 border-0 text-white">
                            Needs attention
                          </span>
                        </div>
                      </div>
                      <div className="bg-white/20 p-3 rounded-xl">
                        <Clock size={28} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Revenue Trend Chart */}
                <div className="lg:col-span-2 min-w-0 card bg-base-100 shadow-lg border border-base-200">
                  <div className="card-body overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="card-title flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-100">
                          <TrendingUp size={20} className="text-emerald-600" />
                        </div>
                        Revenue Trend
                      </h3>
                      <div className="badge badge-success badge-outline">Last 30 Days</div>
                    </div>
                    
                    {salesData?.revenueTrend && salesData.revenueTrend.length > 0 ? (
                      <div className="w-full">
                        <ResponsiveContainer width="100%" height={280}>
                          <AreaChart
                            data={salesData.revenueTrend.slice(-14)}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              axisLine={{ stroke: '#d1d5db' }}
                            />
                            <YAxis 
                              tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              axisLine={{ stroke: '#d1d5db' }}
                            />
                            <Tooltip 
                              formatter={(value) => [formatCurrency(value), 'Revenue']}
                              contentStyle={{ 
                                backgroundColor: '#fff', 
                                border: '1px solid #e5e7eb',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                color: '#000'
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="#22c55e"
                              strokeWidth={2}
                              fill="url(#colorRevenueGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-base-content/50">
                        No revenue data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Status Pie Chart */}
                <div className="min-w-0 card bg-base-100 shadow-lg border border-base-200">
                  <div className="card-body overflow-hidden">
                    <h3 className="card-title flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Package size={20} className="text-blue-600" />
                      </div>
                      Order Status
                    </h3>
                    
                    {orderStatusData.length > 0 ? (
                      <>
                        <div className="w-full">
                          <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                              <Pie
                                data={orderStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={75}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {orderStatusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value, name) => [value, name]}
                                contentStyle={{ 
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 mt-2">
                          {orderStatusData.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: item.color }}
                              ></div>
                              <span className="text-sm text-base-content/70">{item.name}</span>
                              <span className="text-sm font-bold">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-base-content/50">
                        No order data available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats & Services */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Quick Stats */}
                <div className="card bg-base-100 shadow-lg border border-base-200">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-violet-100">
                        <BarChart3 size={20} className="text-violet-600" />
                      </div>
                      Quick Stats
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <span className="text-base-content flex items-center gap-2">
                          <Calendar size={16} className="text-emerald-500" />
                          This Month
                        </span>
                        <span className="font-bold text-emerald-500">
                          {formatCurrency(stats?.keyMetrics?.thisMonthRevenue || salesData?.summary?.totalRevenue || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <span className="text-base-content flex items-center gap-2">
                          <Clock size={16} className="text-blue-500" />
                          This Week
                        </span>
                        <span className="font-bold text-blue-500">
                          {formatCurrency(stats?.quickStats?.weekRevenue || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <span className="text-base-content flex items-center gap-2">
                          <ShoppingCart size={16} className="text-amber-500" />
                          Avg Order
                        </span>
                        <span className="font-bold text-amber-500">
                          {formatCurrency(salesData?.summary?.averageOrderValue || stats?.quickStats?.avgOrderValue || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                        <span className="text-base-content flex items-center gap-2">
                          <CheckCircle size={16} className="text-violet-500" />
                          Completion Rate
                        </span>
                        <span className="font-bold text-violet-500">
                          {salesData?.orderStats?.completionRate || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Services */}
                <div className="lg:col-span-2 card bg-base-100 shadow-lg border border-base-200">
                  <div className="card-body">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="card-title flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-amber-100">
                          <Star size={20} className="text-amber-600" />
                        </div>
                        Top Services
                      </h3>
                      <button 
                        className="btn btn-sm btn-ghost"
                        onClick={() => navigate('/dashboard/admin/reports/sales')}
                      >
                        View All
                      </button>
                    </div>
                    
                    {salesData?.topServices && salesData.topServices.length > 0 ? (
                      <div className="space-y-3">
                        {salesData.topServices.slice(0, 4).map((service, index) => (
                          <div 
                            key={index} 
                            className={`flex items-center justify-between p-4 rounded-xl transition-all hover:shadow-md ${
                              index === 0 ? 'bg-amber-500/10 border border-amber-500/30' :
                              'bg-base-200/50 hover:bg-base-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                index === 0 ? 'bg-amber-500 text-white' :
                                index === 1 ? 'bg-slate-400 text-white' :
                                index === 2 ? 'bg-orange-400 text-white' :
                                'bg-base-300 text-base-content'
                              }`}>
                                #{index + 1}
                              </div>
                              <div>
                                <h4 className="font-semibold">{service.name}</h4>
                                <p className="text-sm text-base-content/60">{service.orders} orders • {service.quantity} units</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-emerald-600">{formatCurrency(service.revenue)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-base-content/50">
                        No service data available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Orders & Staff Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Recent Orders */}
                <div className="lg:col-span-2 card bg-base-100 shadow-lg border border-base-200">
                  <div className="card-body">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="card-title flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <Package size={20} className="text-blue-600" />
                        </div>
                        Recent Orders
                      </h3>
                      <button 
                        className="btn btn-sm btn-ghost"
                        onClick={() => navigate('/dashboard/admin/orders')}
                      >
                        View All
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr className="bg-base-200/50">
                            <th className="rounded-l-lg">Order ID</th>
                            <th>Customer</th>
                            <th>Status</th>
                            <th>Amount</th>
                            <th className="rounded-r-lg">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats?.recentActivity?.slice(0, 5).map((order) => (
                            <tr key={order._id} className="hover:bg-base-50">
                              <td className="font-mono text-sm font-medium">{order.orderNumber}</td>
                              <td>{order.customer?.firstName} {order.customer?.lastName}</td>
                              <td>
                                <div className={`badge badge-sm ${
                                  order.status === 'delivered' ? 'badge-success' :
                                  order.status === 'cancelled' ? 'badge-error' :
                                  order.status === 'pending' ? 'badge-warning' :
                                  'badge-info'
                                }`}>
                                  {order.status}
                                </div>
                              </td>
                              <td className="font-semibold text-emerald-600">
                                {formatCurrency(order.totalAmount || order.totalPrice)}
                              </td>
                              <td className="text-sm text-base-content/60">
                                {new Date(order.createdAt).toLocaleDateString('en-PH', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </td>
                            </tr>
                          ))}
                          {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                            <tr>
                              <td colSpan="5" className="text-center text-base-content/50 py-8">
                                No recent orders
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Staff Overview & Quick Actions */}
                <div className="space-y-6">
                  {/* Staff Overview */}
                  <div className="card bg-base-100 shadow-lg border border-base-200">
                    <div className="card-body">
                      <h3 className="card-title flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-cyan-100">
                          <Users size={20} className="text-cyan-600" />
                        </div>
                        Staff Overview
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                          <div className="text-3xl font-bold text-cyan-600">
                            {stats?.staffOverview?.activeStaff || 0}
                          </div>
                          <div className="text-sm text-base-content/60">Active</div>
                        </div>
                        <div className="text-center p-4 bg-slate-500/10 border border-slate-500/20 rounded-xl">
                          <div className="text-3xl font-bold text-slate-600">
                            {stats?.staffOverview?.totalStaff || 0}
                          </div>
                          <div className="text-sm text-base-content/60">Total</div>
                        </div>
                      </div>
                      <button 
                        className="btn btn-primary btn-block mt-4"
                        onClick={() => navigate('/dashboard/admin/users')}
                      >
                        <Users size={18} />
                        Manage Staff
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="card bg-base-100 shadow-lg border border-base-200">
                    <div className="card-body">
                      <h3 className="card-title flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-rose-100">
                          <Activity size={20} className="text-rose-600" />
                        </div>
                        Quick Actions
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          className="btn btn-outline btn-sm h-auto py-3 flex-col gap-1"
                          onClick={() => navigate('/dashboard/admin/orders')}
                        >
                          <Package size={18} />
                          <span className="text-xs">Orders</span>
                        </button>
                        <button 
                          className="btn btn-outline btn-sm h-auto py-3 flex-col gap-1"
                          onClick={() => navigate('/dashboard/admin/services')}
                        >
                          <Star size={18} />
                          <span className="text-xs">Services</span>
                        </button>
                        <button 
                          className="btn btn-outline btn-sm h-auto py-3 flex-col gap-1"
                          onClick={() => navigate('/dashboard/admin/sales-report')}
                        >
                          <BarChart3 size={18} />
                          <span className="text-xs">Sales</span>
                        </button>
                        <button 
                          className="btn btn-outline btn-sm h-auto py-3 flex-col gap-1"
                          onClick={() => navigate('/dashboard/admin/walk-in')}
                        >
                          <Truck size={18} />
                          <span className="text-xs">Walk-in</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods Summary */}
              {salesData?.paymentMethods && Object.keys(salesData.paymentMethods).length > 0 && (
                <div className="card bg-base-100 shadow-lg border border-base-200 mb-8">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2 mb-6">
                      <div className="p-2 rounded-lg bg-indigo-100">
                        <DollarSign size={20} className="text-indigo-600" />
                      </div>
                      Payment Methods Overview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(salesData.paymentMethods).map(([method, data], index) => (
                        <div 
                          key={method}
                          className="p-5 rounded-xl border-2 transition-all hover:shadow-lg"
                          style={{ borderColor: CHART_COLORS[index % CHART_COLORS.length] + '40' }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-lg capitalize">{method}</span>
                            <span className="badge badge-lg" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length], color: 'white' }}>
                              {data.count} orders
                            </span>
                          </div>
                          <div className="text-2xl font-bold mb-2" style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}>
                            {formatCurrency(data.revenue)}
                          </div>
                          <div className="w-full bg-base-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full transition-all"
                              style={{ 
                                width: `${(data.revenue / salesData.summary.totalRevenue * 100) || 0}%`,
                                backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard


