import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AdminSidebar, AdminNavbar } from '../../components/navbars/AdminNavbar'
import { salesAPI } from '../../services/api'
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package,
  Calendar,
  Loader,
  AlertCircle,
  Download,
  Filter,
  CheckCircle,
  BarChart3,
  CreditCard,
  Percent,
  Award,
  PieChart
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts'

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const SalesReport = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [salesData, setSalesData] = useState(null)
  const [filterPeriod, setFilterPeriod] = useState('month') // today, week, month, year, custom
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

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
      fetchSalesReport()
    }
  }, [user, filterPeriod])

  const fetchSalesReport = async () => {
    try {
      setLoading(true)
      
      let params = {}
      if (filterPeriod === 'custom') {
        if (customDateRange.startDate && customDateRange.endDate) {
          params = {
            startDate: customDateRange.startDate,
            endDate: customDateRange.endDate
          }
        } else {
          toast.error('Please select both start and end dates for custom range')
          setLoading(false)
          return
        }
      } else {
        params = { period: filterPeriod }
      }

      const response = await salesAPI.getSalesReport(params)
      setSalesData(response.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load sales report')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomDateFilter = () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      fetchSalesReport()
    } else {
      toast.error('Please select both start and end dates')
    }
  }

  const exportToCSV = () => {
    if (!salesData) return

    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "Sales Report\n\n"
    csvContent += `Period: ${filterPeriod}\n`
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`
    
    csvContent += "Summary\n"
    csvContent += `Total Revenue,${salesData.summary.totalRevenue}\n`
    csvContent += `Completed Revenue,${salesData.summary.completedRevenue}\n`
    csvContent += `Pending Revenue,${salesData.summary.pendingRevenue}\n`
    csvContent += `Average Order Value,${salesData.summary.averageOrderValue}\n`
    csvContent += `Total Orders,${salesData.summary.totalOrders}\n\n`

    csvContent += "Top Services\n"
    csvContent += "Service Name,Revenue,Quantity,Orders\n"
    salesData.topServices.forEach(service => {
      csvContent += `${service.name},${service.revenue},${service.quantity},${service.orders}\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <AdminSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <AdminNavbar toggleSidebar={toggleSidebar} />

      <div className="lg:ml-64 pt-28 md:pt-32 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-success/10">
                  <TrendingUp className="text-success" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Sales Report</h1>
                  <p className="text-base-content/60">Revenue analytics and performance metrics</p>
                </div>
              </div>
              <button
                onClick={exportToCSV}
                className="btn btn-primary gap-2"
                disabled={!salesData || loading}
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>

            <div className="card bg-base-100 shadow-md mb-6">
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Filter size={18} />
                  <h3 className="font-semibold">Filter by Period</h3>
                </div>
                
                <div className="flex gap-2 flex-wrap mb-4">
                  <button
                    onClick={() => setFilterPeriod('today')}
                    className={`btn btn-sm ${filterPeriod === 'today' ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setFilterPeriod('week')}
                    className={`btn btn-sm ${filterPeriod === 'week' ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setFilterPeriod('month')}
                    className={`btn btn-sm ${filterPeriod === 'month' ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => setFilterPeriod('year')}
                    className={`btn btn-sm ${filterPeriod === 'year' ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    Last Year
                  </button>
                  <button
                    onClick={() => setFilterPeriod('custom')}
                    className={`btn btn-sm ${filterPeriod === 'custom' ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    Custom Range
                  </button>
                </div>

                {filterPeriod === 'custom' && (
                  <div className="flex gap-3 items-end">
                    <div className="form-control flex-1">
                      <label className="label">
                        <span className="label-text">Start Date</span>
                      </label>
                      <input
                        type="date"
                        className="input input-bordered"
                        value={customDateRange.startDate}
                        onChange={(e) => setCustomDateRange({...customDateRange, startDate: e.target.value})}
                      />
                    </div>
                    <div className="form-control flex-1">
                      <label className="label">
                        <span className="label-text">End Date</span>
                      </label>
                      <input
                        type="date"
                        className="input input-bordered"
                        value={customDateRange.endDate}
                        onChange={(e) => setCustomDateRange({...customDateRange, endDate: e.target.value})}
                      />
                    </div>
                    <button
                      onClick={handleCustomDateFilter}
                      className="btn btn-primary"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader className="animate-spin mx-auto mb-2 text-primary" size={32} />
                <p className="text-base-content/60">Loading sales report...</p>
              </div>
            </div>
          ) : salesData ? (
            <>
              {/* Summary Cards - Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="stat bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="stat-figure opacity-80">
                    <DollarSign size={40} />
                  </div>
                  <div className="stat-title text-emerald-100">Total Revenue</div>
                  <div className="stat-value text-2xl">{formatCurrency(salesData.summary.totalRevenue)}</div>
                  <div className="stat-desc text-emerald-200">All orders in period</div>
                </div>

                <div className="stat bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="stat-figure opacity-80">
                    <CheckCircle size={40} />
                  </div>
                  <div className="stat-title text-blue-100">Completed Revenue</div>
                  <div className="stat-value text-2xl">{formatCurrency(salesData.summary.completedRevenue)}</div>
                  <div className="stat-desc text-blue-200">{salesData.orderStats.completed} completed orders</div>
                </div>

                <div className="stat bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="stat-figure opacity-80">
                    <ShoppingCart size={40} />
                  </div>
                  <div className="stat-title text-amber-100">Avg. Order Value</div>
                  <div className="stat-value text-2xl">{formatCurrency(salesData.summary.averageOrderValue)}</div>
                  <div className="stat-desc text-amber-200">Per transaction</div>
                </div>

                <div className="stat bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="stat-figure opacity-80">
                    <Percent size={40} />
                  </div>
                  <div className="stat-title text-violet-100">Completion Rate</div>
                  <div className="stat-value text-2xl">{salesData.orderStats.completionRate}%</div>
                  <div className="stat-desc text-violet-200">{salesData.summary.totalOrders} total orders</div>
                </div>
              </div>

              {/* Main Charts Section */}
              {salesData.monthlyTrend && salesData.monthlyTrend.length > 0 && (
                <div className="card bg-base-100 shadow-lg mb-8 border border-base-200">
                  <div className="card-body overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="card-title flex items-center gap-2 text-xl">
                        <div className="p-2 rounded-lg bg-emerald-100">
                          <BarChart3 size={24} className="text-emerald-600" />
                        </div>
                        Revenue & Orders Overview
                      </h3>
                      <div className="badge badge-lg badge-success gap-1">
                        <TrendingUp size={14} />
                        Monthly Trend
                      </div>
                    </div>
                    <div className="w-full mt-4">
                      <ResponsiveContainer width="100%" height={400}>
                        <ComposedChart
                          data={salesData.monthlyTrend}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.2}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            axisLine={{ stroke: '#d1d5db' }}
                            tickLine={{ stroke: '#d1d5db' }}
                          />
                          <YAxis 
                            yAxisId="left"
                            tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            axisLine={{ stroke: '#d1d5db' }}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            axisLine={{ stroke: '#d1d5db' }}
                          />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'Revenue' ? formatCurrency(value) : value, 
                              name
                            ]}
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                              color: '#000'
                            }}
                            labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#000' }}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px' }}
                          />
                          <Bar 
                            yAxisId="left"
                            dataKey="revenue" 
                            name="Revenue" 
                            fill="url(#colorRevenue)"
                            radius={[6, 6, 0, 0]}
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="orders" 
                            name="Orders" 
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                            activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Stats & Payment Analysis Side by Side */}
              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Order Status Breakdown */}
                <div className="card bg-base-100 shadow-lg border border-base-200">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Package size={20} className="text-blue-600" />
                      </div>
                      Order Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-lg border-l-4 border-emerald-500">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="text-emerald-500" />
                          <span className="font-medium">Completed</span>
                        </div>
                        <span className="text-xl font-bold text-emerald-600">{salesData.orderStats.completed}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-amber-500/10 rounded-lg border-l-4 border-amber-500">
                        <div className="flex items-center gap-2">
                          <Package size={18} className="text-amber-500" />
                          <span className="font-medium">Pending</span>
                        </div>
                        <span className="text-xl font-bold text-amber-600">{salesData.orderStats.pending}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg border-l-4 border-red-500">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={18} className="text-red-500" />
                          <span className="font-medium">Cancelled</span>
                        </div>
                        <span className="text-xl font-bold text-red-600">{salesData.orderStats.cancelled}</span>
                      </div>
                      <div className="divider my-2"></div>
                      <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="text-sm text-base-content/60 mb-1">Total Orders</div>
                        <div className="text-3xl font-bold text-blue-600">{salesData.orderStats.total}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="card bg-base-100 shadow-lg border border-base-200">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-emerald-100">
                        <DollarSign size={20} className="text-emerald-600" />
                      </div>
                      Payment Status
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(salesData.paymentStatus).map(([status, data]) => (
                        <div 
                          key={status} 
                          className={`p-4 rounded-xl ${
                            status === 'paid' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' :
                            status === 'pending' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 
                            'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm opacity-90 capitalize">{status}</div>
                              <div className="text-lg font-bold">{formatCurrency(data.revenue)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">{data.count}</div>
                              <div className="text-xs opacity-90">orders</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="card bg-base-100 shadow-lg border border-base-200">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-violet-100">
                        <CreditCard size={20} className="text-violet-600" />
                      </div>
                      Payment Methods
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(salesData.paymentMethods).map(([method, data], index) => (
                        <div key={method} className="p-4 bg-base-200/50 rounded-xl hover:bg-base-200 transition-colors">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold capitalize flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                              {method}
                            </span>
                            <span className="badge badge-ghost">{data.count} orders</span>
                          </div>
                          <div className="text-xl font-bold" style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}>
                            {formatCurrency(data.revenue)}
                          </div>
                          <div className="w-full bg-base-300 rounded-full h-2 mt-2">
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
              </div>

              {/* Top Services */}
              <div className="card bg-base-100 shadow-lg mb-8 border border-base-200">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="card-title flex items-center gap-2 text-xl">
                      <div className="p-2 rounded-lg bg-amber-100">
                        <Award size={24} className="text-amber-600" />
                      </div>
                      Top Performing Services
                    </h3>
                    <div className="badge badge-lg badge-warning gap-1">
                      <TrendingUp size={14} />
                      Best Sellers
                    </div>
                  </div>
                  {salesData.topServices && salesData.topServices.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {salesData.topServices.slice(0, 6).map((service, index) => (
                        <div 
                          key={index} 
                          className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
                            index === 0 ? 'bg-amber-500/10 border-amber-500/30' :
                            index === 1 ? 'bg-slate-500/10 border-slate-500/30' :
                            index === 2 ? 'bg-orange-500/10 border-orange-500/30' :
                            'bg-base-100 border-base-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                              index === 0 ? 'bg-amber-500 text-white' :
                              index === 1 ? 'bg-slate-400 text-white' :
                              index === 2 ? 'bg-orange-400 text-white' :
                              'bg-base-300 text-base-content'
                            }`}>
                              #{index + 1}
                            </div>
                            {index < 3 && (
                              <Award size={24} className={
                                index === 0 ? 'text-amber-500' :
                                index === 1 ? 'text-slate-400' :
                                'text-orange-400'
                              } />
                            )}
                          </div>
                          <h4 className="font-bold text-lg mb-2">{service.name}</h4>
                          <div className="text-2xl font-bold text-emerald-600 mb-2">
                            {formatCurrency(service.revenue)}
                          </div>
                          <div className="flex gap-3 text-sm text-base-content/60">
                            <span className="flex items-center gap-1">
                              <Package size={14} />
                              {service.quantity} units
                            </span>
                            <span className="flex items-center gap-1">
                              <ShoppingCart size={14} />
                              {service.orders} orders
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-base-content/60 text-center py-8">No service data available</p>
                  )}
                </div>
              </div>

              {/* Daily Revenue Trend */}
              {salesData.revenueTrend && salesData.revenueTrend.length > 0 && (
                <div className="card bg-base-100 shadow-lg mb-8 border border-base-200">
                  <div className="card-body overflow-hidden">
                    <h3 className="card-title flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-cyan-100">
                        <Calendar size={20} className="text-cyan-600" />
                      </div>
                      Daily Revenue Trend
                    </h3>
                    <div className="w-full mt-4">
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart
                          data={salesData.revenueTrend.slice(-14)}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <defs>
                            <linearGradient id="colorDailyRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
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
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            axisLine={{ stroke: '#d1d5db' }}
                          />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'revenue' ? formatCurrency(value) : value, 
                              name === 'revenue' ? 'Revenue' : 'Orders'
                            ]}
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
                            name="revenue"
                            stroke="#06b6d4"
                            strokeWidth={2}
                            fill="url(#colorDailyRevenue)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly Performance Table */}
              {salesData.monthlyTrend && salesData.monthlyTrend.length > 0 && (
                <div className="card bg-base-100 shadow-lg border border-base-200">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-violet-100">
                        <BarChart3 size={20} className="text-violet-600" />
                      </div>
                      Monthly Performance Details
                    </h3>
                    <div className="overflow-x-auto mt-4">
                      <table className="table">
                        <thead>
                          <tr className="bg-base-200">
                            <th className="rounded-l-lg">Month</th>
                            <th>Orders</th>
                            <th>Revenue</th>
                            <th className="rounded-r-lg">Avg. Order Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesData.monthlyTrend.map((month, index) => (
                            <tr key={index} className="hover:bg-base-50">
                              <td className="font-semibold">{month.month}</td>
                              <td>
                                <span className="badge badge-ghost badge-lg">{month.orders}</span>
                              </td>
                              <td className="font-bold text-emerald-600 text-lg">{formatCurrency(month.revenue)}</td>
                              <td className="text-blue-600 font-medium">{formatCurrency(month.orders > 0 ? month.revenue / month.orders : 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="mx-auto mb-3 text-base-content/40" size={40} />
              <p className="text-base-content/60">No sales data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SalesReport


