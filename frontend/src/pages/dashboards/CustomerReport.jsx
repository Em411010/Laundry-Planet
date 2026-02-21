import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AdminSidebar, AdminNavbar } from '../../components/navbars/AdminNavbar'
import { customerAPI } from '../../services/api'
import { 
  Users, 
  TrendingUp, 
  MapPin, 
  DollarSign,
  ShoppingBag,
  Clock,
  Calendar,
  Loader,
  AlertCircle,
  Download,
  Filter,
  Star,
  Award,
  UserCheck
} from 'lucide-react'

const CustomerReport = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [customerData, setCustomerData] = useState(null)
  const [segmentationData, setSegmentationData] = useState(null)
  const [filterPeriod, setFilterPeriod] = useState('all')
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
      fetchCustomerReport()
      fetchSegmentation()
    }
  }, [user, filterPeriod])

  const fetchCustomerReport = async () => {
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
      } else if (filterPeriod !== 'all') {
        params = { period: filterPeriod }
      }

      const response = await customerAPI.getCustomerReport(params)
      setCustomerData(response.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load customer report')
    } finally {
      setLoading(false)
    }
  }

  const fetchSegmentation = async () => {
    try {
      const response = await customerAPI.getCustomerSegmentation()
      setSegmentationData(response.data)
    } catch (err) {
      console.error('Failed to load segmentation data:', err)
    }
  }

  const handleCustomDateFilter = () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      fetchCustomerReport()
    } else {
      toast.error('Please select both start and end dates')
    }
  }

  const exportToCSV = () => {
    if (!customerData) return

    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "Customer Report\n\n"
    csvContent += `Period: ${filterPeriod}\n`
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`
    
    csvContent += "Summary\n"
    csvContent += `Total Customers,${customerData.summary.totalCustomers}\n`
    csvContent += `New Customers,${customerData.summary.newCustomers}\n`
    csvContent += `Active Customers,${customerData.summary.activeCustomers}\n`
    csvContent += `Avg Lifetime Value,${customerData.summary.avgLifetimeValue}\n`
    csvContent += `Avg Orders Per Customer,${customerData.summary.avgOrdersPerCustomer}\n`
    csvContent += `Retention Rate,${customerData.summary.retentionRate}%\n\n`

    csvContent += "Top Customers\n"
    csvContent += "Name,Email,Total Spent,Order Count,Avg Order Value\n"
    customerData.topCustomers.forEach(customer => {
      csvContent += `${customer.name},${customer.email},${customer.totalSpent},${customer.orderCount},${customer.averageOrderValue}\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `customer_report_${new Date().toISOString().split('T')[0]}.csv`)
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
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="text-primary" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Customer Report</h1>
                  <p className="text-base-content/60">Customer analytics and behavior insights</p>
                </div>
              </div>
              <button
                onClick={exportToCSV}
                className="btn btn-primary gap-2"
                disabled={!customerData || loading}
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
                    onClick={() => setFilterPeriod('all')}
                    className={`btn btn-sm ${filterPeriod === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    All Time
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
                <p className="text-base-content/60">Loading customer report...</p>
              </div>
            </div>
          ) : customerData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="stat bg-gradient-to-br from-primary to-primary/70 text-primary-content rounded-lg shadow-lg">
                  <div className="stat-figure">
                    <Users size={32} />
                  </div>
                  <div className="stat-title text-primary-content/80">Total Customers</div>
                  <div className="stat-value text-2xl">{customerData.summary.totalCustomers}</div>
                  <div className="stat-desc text-primary-content/70">
                    {customerData.summary.newCustomers} new in period
                  </div>
                </div>

                <div className="stat bg-gradient-to-br from-success to-success/70 text-success-content rounded-lg shadow-lg">
                  <div className="stat-figure">
                    <UserCheck size={32} />
                  </div>
                  <div className="stat-title text-success-content/80">Active Customers</div>
                  <div className="stat-value text-2xl">{customerData.summary.activeCustomers}</div>
                  <div className="stat-desc text-success-content/70">
                    {customerData.summary.retentionRate}% retention rate
                  </div>
                </div>

                <div className="stat bg-gradient-to-br from-warning to-warning/70 text-warning-content rounded-lg shadow-lg">
                  <div className="stat-figure">
                    <DollarSign size={32} />
                  </div>
                  <div className="stat-title text-warning-content/80">Avg Lifetime Value</div>
                  <div className="stat-value text-2xl">{formatCurrency(customerData.summary.avgLifetimeValue)}</div>
                  <div className="stat-desc text-warning-content/70">
                    {customerData.summary.avgOrdersPerCustomer.toFixed(1)} orders per customer
                  </div>
                </div>
              </div>

              {segmentationData && (
                <div className="card bg-base-100 shadow-md mb-6">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2">
                      <Award size={20} />
                      Customer Segmentation
                    </h3>
                    <div className="grid md:grid-cols-4 gap-4 mt-4">
                      <div className="stat bg-gradient-to-br from-purple-500 to-purple-400 text-white rounded-lg">
                        <div className="stat-figure">
                          <Star size={24} />
                        </div>
                        <div className="stat-title text-white/90">VIP</div>
                        <div className="stat-value text-2xl">{segmentationData.segments.vip.count}</div>
                        <div className="stat-desc text-white/80">10+ orders or ₱50k+</div>
                      </div>

                      <div className="stat bg-gradient-to-br from-blue-500 to-blue-400 text-white rounded-lg">
                        <div className="stat-figure">
                          <Award size={24} />
                        </div>
                        <div className="stat-title text-white/90">Loyal</div>
                        <div className="stat-value text-2xl">{segmentationData.segments.loyal.count}</div>
                        <div className="stat-desc text-white/80">5-10 orders or ₱20k-50k</div>
                      </div>

                      <div className="stat bg-gradient-to-br from-green-500 to-green-400 text-white rounded-lg">
                        <div className="stat-figure">
                          <UserCheck size={24} />
                        </div>
                        <div className="stat-title text-white/90">Regular</div>
                        <div className="stat-value text-2xl">{segmentationData.segments.regular.count}</div>
                        <div className="stat-desc text-white/80">2-4 orders or ₱5k-20k</div>
                      </div>

                      <div className="stat bg-gradient-to-br from-orange-500 to-orange-400 text-white rounded-lg">
                        <div className="stat-figure">
                          <Users size={24} />
                        </div>
                        <div className="stat-title text-white/90">New</div>
                        <div className="stat-value text-2xl">{segmentationData.segments.new.count}</div>
                        <div className="stat-desc text-white/80">1 order or less than ₱5k</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="card bg-base-100 shadow-md min-w-0">
                  <div className="card-body overflow-hidden">
                    <h3 className="card-title flex items-center gap-2">
                      <TrendingUp size={20} />
                      Top Customers by Lifetime Value
                    </h3>
                    <div className="overflow-x-auto mt-4">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Customer</th>
                            <th className="hidden sm:table-cell">Email</th>
                            <th>Spent</th>
                            <th>Orders</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerData.topCustomers.map((customer, index) => (
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
                              <td>
                                <div className="font-semibold truncate max-w-[120px]">{customer.name}</div>
                              </td>
                              <td className="hidden sm:table-cell">
                                <div className="text-xs opacity-70 truncate max-w-[150px]">{customer.email}</div>
                              </td>
                              <td className="font-bold text-success">{formatCurrency(customer.totalSpent)}</td>
                              <td>{customer.orderCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-100 shadow-md min-w-0">
                  <div className="card-body overflow-hidden">
                    <h3 className="card-title flex items-center gap-2">
                      <MapPin size={20} />
                      Geographic Distribution
                    </h3>
                    <div className="space-y-3 mt-4">
                      {customerData.geographicDistribution.slice(0, 8).map((location, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 p-3 bg-base-200 rounded">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <MapPin size={16} className="text-primary flex-shrink-0" />
                            <span className="font-medium truncate">{location.city}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="badge badge-lg">{location.count}</span>
                            <span className="text-sm text-base-content/60 hidden sm:inline">customers</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md mb-6">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2">
                    <ShoppingBag size={20} />
                    Preferred Services
                  </h3>
                  <div className="overflow-x-auto mt-4">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Total Orders</th>
                          <th>Total Quantity</th>
                          <th>Unique Customers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerData.preferredServices.map((service, index) => (
                          <tr key={index}>
                            <td className="font-semibold">{service.name}</td>
                            <td>{service.orderCount}</td>
                            <td>{service.totalQuantity} units</td>
                            <td>
                              <div className="badge badge-primary">{service.uniqueCustomers}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2">
                      <Clock size={20} />
                      Peak Ordering Times
                    </h3>
                    <div className="space-y-4 mt-4">
                      <div className="alert alert-info">
                        <Clock size={18} />
                        <div>
                          <div className="font-semibold">Peak Hour: {customerData.orderBehavior.peakHour}</div>
                          <div className="text-sm">Peak Day: {customerData.orderBehavior.peakDay}</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Orders by Day of Week</h4>
                        <div className="space-y-2">
                          {customerData.orderBehavior.dailyDistribution.map((day, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="text-sm w-24">{day.day}</span>
                              <progress 
                                className="progress progress-primary w-full" 
                                value={day.orders} 
                                max={Math.max(...customerData.orderBehavior.dailyDistribution.map(d => d.orders))}
                              ></progress>
                              <span className="badge badge-sm">{day.orders}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2">
                      <ShoppingBag size={20} />
                      Order Frequency Distribution
                    </h3>
                    <div className="space-y-3 mt-4">
                      {Object.entries(customerData.orderBehavior.frequencyBuckets).map(([bucket, count], index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-base-200 rounded">
                          <span className="font-medium">{bucket}</span>
                          <div className="flex items-center gap-2">
                            <span className="badge badge-lg badge-primary">{count}</span>
                            <span className="text-sm text-base-content/60">customers</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {customerData.registrationTrends && customerData.registrationTrends.length > 0 && (
                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2">
                      <Calendar size={20} />
                      Customer Registration Trends
                    </h3>
                    <div className="overflow-x-auto mt-4">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Month</th>
                            <th>New Registrations</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerData.registrationTrends.slice(-12).map((trend, index) => (
                            <tr key={index}>
                              <td className="font-semibold">{trend.month}</td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <progress 
                                    className="progress progress-success w-32" 
                                    value={trend.count} 
                                    max={Math.max(...customerData.registrationTrends.map(t => t.count))}
                                  ></progress>
                                  <span className="badge">{trend.count}</span>
                                </div>
                              </td>
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
              <Users className="mx-auto mb-3 text-base-content/40" size={40} />
              <p className="text-base-content/60">No customer data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerReport


