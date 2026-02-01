import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  CheckCircle
} from 'lucide-react'

const SalesReport = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
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
      setError(null)
      
      let params = {}
      if (filterPeriod === 'custom') {
        if (customDateRange.startDate && customDateRange.endDate) {
          params = {
            startDate: customDateRange.startDate,
            endDate: customDateRange.endDate
          }
        } else {
          setError('Please select both start and end dates for custom range')
          setLoading(false)
          return
        }
      } else {
        params = { period: filterPeriod }
      }

      const response = await salesAPI.getSalesReport(params)
      setSalesData(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sales report')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomDateFilter = () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      fetchSalesReport()
    } else {
      setError('Please select both start and end dates')
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

      <div className="lg:ml-64 pt-32 mt-12 p-4 md:p-8">
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

          {error && (
            <div className="alert alert-error mb-6">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader className="animate-spin mx-auto mb-2 text-primary" size={32} />
                <p className="text-base-content/60">Loading sales report...</p>
              </div>
            </div>
          ) : salesData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="stat bg-gradient-to-br from-success to-success/70 text-success-content rounded-lg shadow-lg">
                  <div className="stat-figure">
                    <DollarSign size={32} />
                  </div>
                  <div className="stat-title text-success-content/80">Total Revenue</div>
                  <div className="stat-value text-2xl">{formatCurrency(salesData.summary.totalRevenue)}</div>
                  <div className="stat-desc text-success-content/70">All orders</div>
                </div>

                <div className="stat bg-gradient-to-br from-primary to-primary/70 text-primary-content rounded-lg shadow-lg">
                  <div className="stat-figure">
                    <CheckCircle size={32} />
                  </div>
                  <div className="stat-title text-primary-content/80">Completed Revenue</div>
                  <div className="stat-value text-2xl">{formatCurrency(salesData.summary.completedRevenue)}</div>
                  <div className="stat-desc text-primary-content/70">{salesData.orderStats.completed} orders</div>
                </div>

                <div className="stat bg-gradient-to-br from-warning to-warning/70 text-warning-content rounded-lg shadow-lg">
                  <div className="stat-figure">
                    <ShoppingCart size={32} />
                  </div>
                  <div className="stat-title text-warning-content/80">Average Order Value</div>
                  <div className="stat-value text-2xl">{formatCurrency(salesData.summary.averageOrderValue)}</div>
                  <div className="stat-desc text-warning-content/70">Per order</div>
                </div>

                <div className="stat bg-gradient-to-br from-info to-info/70 text-info-content rounded-lg shadow-lg">
                  <div className="stat-figure">
                    <Package size={32} />
                  </div>
                  <div className="stat-title text-info-content/80">Total Orders</div>
                  <div className="stat-value text-2xl">{salesData.summary.totalOrders}</div>
                  <div className="stat-desc text-info-content/70">{salesData.orderStats.completionRate}% completed</div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2">
                      <Package size={20} />
                      Order Statistics
                    </h3>
                    <div className="space-y-3 mt-4">
                      <div className="flex justify-between items-center p-3 bg-base-200 rounded">
                        <span className="font-medium">Total Orders</span>
                        <span className="badge badge-lg">{salesData.orderStats.total}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-success/10 rounded">
                        <span className="font-medium text-success">Completed</span>
                        <span className="badge badge-success badge-lg">{salesData.orderStats.completed}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-warning/10 rounded">
                        <span className="font-medium text-warning">Pending</span>
                        <span className="badge badge-warning badge-lg">{salesData.orderStats.pending}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-error/10 rounded">
                        <span className="font-medium text-error">Cancelled</span>
                        <span className="badge badge-error badge-lg">{salesData.orderStats.cancelled}</span>
                      </div>
                      <div className="divider my-2"></div>
                      <div className="flex justify-between items-center p-3 bg-primary/10 rounded">
                        <span className="font-semibold text-primary">Completion Rate</span>
                        <span className="text-2xl font-bold text-primary">{salesData.orderStats.completionRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2">
                      <DollarSign size={20} />
                      Payment Analysis
                    </h3>
                    <div className="space-y-4 mt-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Payment Status</h4>
                        <div className="space-y-2">
                          {Object.entries(salesData.paymentStatus).map(([status, data]) => (
                            <div key={status} className="flex justify-between items-center p-2 bg-base-200 rounded text-sm">
                              <div className="flex items-center gap-2">
                                <span className={`badge ${
                                  status === 'paid' ? 'badge-success' :
                                  status === 'pending' ? 'badge-warning' : 'badge-error'
                                }`}>
                                  {status}
                                </span>
                                <span className="text-base-content/70">{data.count} orders</span>
                              </div>
                              <span className="font-semibold">{formatCurrency(data.revenue)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="divider my-2"></div>

                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Payment Methods</h4>
                        <div className="space-y-2">
                          {Object.entries(salesData.paymentMethods).map(([method, data]) => (
                            <div key={method} className="flex justify-between items-center p-2 bg-base-200 rounded text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{method}</span>
                                <span className="text-base-content/70">{data.count} orders</span>
                              </div>
                              <span className="font-semibold">{formatCurrency(data.revenue)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md mb-6">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2">
                    <TrendingUp size={20} />
                    Top Performing Services
                  </h3>
                  {salesData.topServices && salesData.topServices.length > 0 ? (
                    <div className="overflow-x-auto mt-4">
                      <table className="table table-zebra">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Service Name</th>
                            <th>Total Revenue</th>
                            <th>Quantity Sold</th>
                            <th>Orders</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesData.topServices.map((service, index) => (
                            <tr key={index}>
                              <td>
                                <div className={`badge ${
                                  index === 0 ? 'badge-warning' :
                                  index === 1 ? 'badge-info' :
                                  index === 2 ? 'badge-accent' : 'badge-ghost'
                                }`}>
                                  #{index + 1}
                                </div>
                              </td>
                              <td className="font-semibold">{service.name}</td>
                              <td className="font-bold text-success">{formatCurrency(service.revenue)}</td>
                              <td>{service.quantity} units</td>
                              <td>{service.orders} orders</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-base-content/60 text-center py-4">No service data available</p>
                  )}
                </div>
              </div>

              {salesData.revenueTrend && salesData.revenueTrend.length > 0 && (
                <div className="card bg-base-100 shadow-md mb-6">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2">
                      <Calendar size={20} />
                      Revenue Trend
                    </h3>
                    <div className="overflow-x-auto mt-4">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Orders</th>
                            <th>Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesData.revenueTrend.slice(-10).map((day, index) => (
                            <tr key={index}>
                              <td>{day.date}</td>
                              <td>{day.orders}</td>
                              <td className="font-semibold text-success">{formatCurrency(day.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {salesData.monthlyTrend && salesData.monthlyTrend.length > 0 && (
                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2">
                      <TrendingUp size={20} />
                      Monthly Performance
                    </h3>
                    <div className="overflow-x-auto mt-4">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Month</th>
                            <th>Orders</th>
                            <th>Revenue</th>
                            <th>Avg. Order Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesData.monthlyTrend.map((month, index) => (
                            <tr key={index}>
                              <td className="font-semibold">{month.month}</td>
                              <td>{month.orders}</td>
                              <td className="font-bold text-success">{formatCurrency(month.revenue)}</td>
                              <td>{formatCurrency(month.orders > 0 ? month.revenue / month.orders : 0)}</td>
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
