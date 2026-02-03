import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AdminSidebar, AdminNavbar } from '../../components/navbars/AdminNavbar'
import { serviceReportAPI } from '../../services/api'
import { 
  Package, 
  TrendingUp, 
  DollarSign,
  CheckCircle,
  Clock,
  Users,
  Loader,
  AlertCircle,
  Download,
  Filter,
  Star,
  BarChart3,
  Calendar
} from 'lucide-react'

const ServiceReport = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [serviceData, setServiceData] = useState(null)
  const [filterPeriod, setFilterPeriod] = useState('month')
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

  const fetchServiceReport = useCallback(async () => {
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

      const response = await serviceReportAPI.getServiceReport(params)
      setServiceData(response.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load service report')
    } finally {
      setLoading(false)
    }
  }, [filterPeriod, customDateRange])

  useEffect(() => {
    if (user) {
      fetchServiceReport()
    }
  }, [user, fetchServiceReport])

  const handleCustomDateFilter = () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      fetchServiceReport()
    } else {
      toast.error('Please select both start and end dates')
    }
  }

  const exportToCSV = () => {
    if (!serviceData) return

    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "Service Report\n\n"
    csvContent += `Period: ${filterPeriod}\n`
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`
    
    csvContent += "Summary\n"
    csvContent += `Total Service Orders,${serviceData.summary.totalServiceOrders}\n`
    csvContent += `Total Service Revenue,${serviceData.summary.totalServiceRevenue}\n`
    csvContent += `Active Services,${serviceData.summary.activeServices}\n`
    csvContent += `Avg Orders Per Service,${serviceData.summary.avgOrdersPerService}\n\n`

    csvContent += "Top Services\n"
    csvContent += "Service Name,Total Orders,Revenue,Success Rate\n"
    serviceData.servicePopularity.topServices.forEach(service => {
      csvContent += `${service.name},${service.totalOrders},${service.totalRevenue},${service.successRate}%\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `service_report_${new Date().toISOString().split('T')[0]}.csv`)
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
                <div className="p-3 rounded-lg bg-info/10">
                  <Package className="text-info" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Service Report</h1>
                  <p className="text-base-content/60">Service performance and analytics</p>
                </div>
              </div>
              <button
                onClick={exportToCSV}
                className="btn btn-primary gap-2"
                disabled={!serviceData || loading}
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
                <p className="text-base-content/60">Loading service report...</p>
              </div>
            </div>
          ) : serviceData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="stat bg-gradient-to-br from-info to-info/70 text-info-content rounded-lg shadow-lg">
                  <div className="stat-figure">
                    <Package size={32} />
                  </div>
                  <div className="stat-title text-info-content/80">Total Service Orders</div>
                  <div className="stat-value text-2xl">{serviceData.summary.totalServiceOrders}</div>
                  <div className="stat-desc text-info-content/70">
                    {serviceData.summary.activeServices} active services
                  </div>
                </div>

                <div className="stat bg-gradient-to-br from-success to-success/70 text-success-content rounded-lg shadow-lg">
                  <div className="stat-figure">
                    <DollarSign size={32} />
                  </div>
                  <div className="stat-title text-success-content/80">Total Revenue</div>
                  <div className="stat-value text-2xl">{formatCurrency(serviceData.summary.totalServiceRevenue)}</div>
                  <div className="stat-desc text-success-content/70">From all services</div>
                </div>

                <div className="stat bg-gradient-to-br from-warning to-warning/70 text-warning-content rounded-lg shadow-lg">
                  <div className="stat-figure">
                    <BarChart3 size={32} />
                  </div>
                  <div className="stat-title text-warning-content/80">Avg Orders/Service</div>
                  <div className="stat-value text-2xl">{serviceData.summary.avgOrdersPerService}</div>
                  <div className="stat-desc text-warning-content/70">Service utilization</div>
                </div>

                <div className="stat bg-gradient-to-br from-primary to-primary/70 text-primary-content rounded-lg shadow-lg">
                  <div className="stat-figure">
                    <CheckCircle size={32} />
                  </div>
                  <div className="stat-title text-primary-content/80">Avg Success Rate</div>
                  <div className="stat-value text-2xl">{serviceData.performanceMetrics.averageSuccessRate}%</div>
                  <div className="stat-desc text-primary-content/70">Completion rate</div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2">
                      <Star size={20} />
                      Top Services by Popularity
                    </h3>
                    <div className="overflow-x-auto mt-4">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Service</th>
                            <th>Orders</th>
                            <th>Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {serviceData.servicePopularity.topServices.map((service, index) => (
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
                              <td>{service.totalOrders}</td>
                              <td className="font-bold text-success">{formatCurrency(service.totalRevenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2">
                      <TrendingUp size={20} />
                      Service Utilization Rate
                    </h3>
                    <div className="space-y-3 mt-4">
                      {serviceData.servicePopularity.utilizationRate.slice(0, 8).map((service, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{service.name}</span>
                            <span className="badge badge-primary">{service.utilizationRate}%</span>
                          </div>
                          <progress 
                            className="progress progress-primary w-full" 
                            value={service.utilizationRate} 
                            max="100"
                          ></progress>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md mb-6">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2">
                    <CheckCircle size={20} />
                    Performance Metrics - Top Success Rates
                  </h3>
                  <div className="overflow-x-auto mt-4">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Total Orders</th>
                          <th>Completed</th>
                          <th>Pending</th>
                          <th>Success Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceData.performanceMetrics.topSuccessRateServices.map((service, index) => (
                          <tr key={index}>
                            <td className="font-semibold">{service.name}</td>
                            <td>{service.totalOrders}</td>
                            <td>
                              <span className="badge badge-success">{service.completedOrders}</span>
                            </td>
                            <td>
                              <span className="badge badge-warning">{service.pendingOrders}</span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <progress 
                                  className="progress progress-success w-24" 
                                  value={service.successRate} 
                                  max="100"
                                ></progress>
                                <span className="font-bold text-success">{service.successRate}%</span>
                              </div>
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
                      <DollarSign size={20} />
                      Revenue Contribution
                    </h3>
                    <div className="space-y-3 mt-4">
                      {serviceData.revenueContribution.revenueByService.slice(0, 10).map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-base-200 rounded">
                          <div className="flex-1">
                            <div className="font-semibold">{service.name}</div>
                            <div className="text-sm text-base-content/60">{service.percentage}% of total</div>
                          </div>
                          <div className="font-bold text-success text-lg">
                            {formatCurrency(service.revenue)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2">
                      <Clock size={20} />
                      Peak Demand Times
                    </h3>
                    <div className="space-y-3 mt-4">
                      {serviceData.demandPatterns.peakHours.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-base-200 rounded">
                          <span className="font-semibold">{service.name}</span>
                          <div className="text-right">
                            <div className="badge badge-info">{service.peakHour}</div>
                            <div className="text-xs text-base-content/60 mt-1">{service.peakDay}</div>
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
                    <Users size={20} />
                    Staff Efficiency & Workload Distribution
                  </h3>
                  <div className="overflow-x-auto mt-4">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Staff Member</th>
                          <th>Total Orders</th>
                          <th>Pickup</th>
                          <th>Processing</th>
                          <th>Delivery</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceData.staffEfficiency.workloadDistribution.map((staff, index) => (
                          <tr key={index}>
                            <td>
                              <div className="font-semibold">{staff.name}</div>
                              <div className="text-xs text-base-content/60">{staff.email}</div>
                            </td>
                            <td>
                              <span className="badge badge-lg badge-primary">{staff.totalOrders}</span>
                            </td>
                            <td>{staff.roleDistribution.pickup}</td>
                            <td>{staff.roleDistribution.processing}</td>
                            <td>{staff.roleDistribution.delivery}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {serviceData.demandPatterns.monthlyTrend && serviceData.demandPatterns.monthlyTrend.length > 0 && (
                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <h3 className="card-title flex items-center gap-2">
                      <Calendar size={20} />
                      Monthly Service Trends
                    </h3>
                    <div className="overflow-x-auto mt-4">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Month</th>
                            <th>Total Orders</th>
                            <th>Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {serviceData.demandPatterns.monthlyTrend.slice(-12).map((trend, index) => (
                            <tr key={index}>
                              <td className="font-semibold">{trend.month}</td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <progress 
                                    className="progress progress-info w-32" 
                                    value={trend.totalOrders} 
                                    max={Math.max(...serviceData.demandPatterns.monthlyTrend.map(t => t.totalOrders))}
                                  ></progress>
                                  <span className="badge">{trend.totalOrders}</span>
                                </div>
                              </td>
                              <td className="font-bold text-success">
                                {formatCurrency(trend.totalRevenue)}
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
              <Package className="mx-auto mb-3 text-base-content/40" size={40} />
              <p className="text-base-content/60">No service data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ServiceReport
