import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AdminSidebar, AdminNavbar } from '../components/navbars/AdminNavbar'
import { serviceReportAPI } from '../services/api'
import { 
  Package, 
  TrendingUp, 
  DollarSign,
  CheckCircle,
  Clock,
  Users,
  Loader,
  AlertCircle,
  Printer,
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

  const handlePrint = () => {
    if (!serviceData) return

    const periodLabel = filterPeriod === 'custom' 
      ? `${customDateRange.startDate} to ${customDateRange.endDate}` 
      : filterPeriod === 'all' ? 'All Time' : filterPeriod.charAt(0).toUpperCase() + filterPeriod.slice(1)

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
      <head>
        <title>Service Report - Laundry Planet</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 11px; line-height: 1.4; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0ea5e9; padding-bottom: 12px; margin-bottom: 20px; }
          .header-left { display: flex; align-items: center; gap: 12px; }
          .logo-circle { width: 40px; height: 40px; background: #0ea5e9; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; }
          .company-name { font-size: 20px; font-weight: 700; color: #0ea5e9; }
          .report-title { font-size: 11px; color: #666; }
          .header-right { text-align: right; font-size: 10px; color: #666; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .summary-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; text-align: center; }
          .summary-card .label { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .summary-card .value { font-size: 16px; font-weight: 700; color: #0ea5e9; }
          .summary-card .sub { font-size: 9px; color: #999; margin-top: 2px; }
          .section { margin-bottom: 18px; }
          .section-title { font-size: 12px; font-weight: 600; color: #333; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th { background: #f3f4f6; padding: 6px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #d1d5db; }
          td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; }
          tr:nth-child(even) { background: #fafafa; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-green { color: #16a34a; font-weight: 600; }
          .text-blue { color: #0ea5e9; font-weight: 600; }
          .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .progress-bar { background: #e5e7eb; border-radius: 4px; height: 6px; overflow: hidden; display: inline-block; width: 60px; vertical-align: middle; margin-right: 6px; }
          .progress-fill { height: 100%; background: #16a34a; border-radius: 4px; }
          .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 9px; color: #999; }
          @media print { body { padding: 20px; } @page { size: A4; margin: 15mm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <div class="logo-circle">LP</div>
            <div>
              <div class="company-name">Laundry Planet</div>
              <div class="report-title">Service Report</div>
            </div>
          </div>
          <div class="header-right">
            <div>Period: ${periodLabel}</div>
            <div>Generated: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="label">Total Service Books</div>
            <div class="value">${serviceData.summary.totalServiceOrders}</div>
            <div class="sub">${serviceData.summary.activeServices} active services</div>
          </div>
          <div class="summary-card">
            <div class="label">Total Revenue</div>
            <div class="value">${formatCurrency(serviceData.summary.totalServiceRevenue)}</div>
            <div class="sub">From all services</div>
          </div>
          <div class="summary-card">
            <div class="label">Avg Books/Service</div>
            <div class="value">${serviceData.summary.avgOrdersPerService}</div>
            <div class="sub">Service utilization</div>
          </div>
          <div class="summary-card">
            <div class="label">Avg Success Rate</div>
            <div class="value">${serviceData.performanceMetrics.averageSuccessRate}%</div>
            <div class="sub">Completion rate</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Top Services by Popularity</div>
          <table>
            <tr><th>#</th><th>Service</th><th class="text-right">Books</th><th class="text-right">Revenue</th><th class="text-right">Success Rate</th></tr>
            ${serviceData.servicePopularity.topServices.map((s, i) => 
              `<tr><td>${i + 1}</td><td>${s.name}</td><td class="text-right">${s.totalOrders}</td><td class="text-right text-green">${formatCurrency(s.totalRevenue)}</td><td class="text-right">${s.successRate}%</td></tr>`
            ).join('')}
          </table>
        </div>

        <div class="section">
          <div class="section-title">Performance Metrics - Success Rates</div>
          <table>
            <tr><th>Service</th><th class="text-right">Total</th><th class="text-right">Completed</th><th class="text-right">Pending</th><th class="text-right">Success Rate</th></tr>
            ${serviceData.performanceMetrics.topSuccessRateServices.map(s => 
              `<tr><td>${s.name}</td><td class="text-right">${s.totalOrders}</td><td class="text-right text-green">${s.completedOrders}</td><td class="text-right">${s.pendingOrders}</td><td class="text-right text-green">${s.successRate}%</td></tr>`
            ).join('')}
          </table>
        </div>

        <div class="two-col">
          <div class="section">
            <div class="section-title">Revenue Contribution</div>
            <table>
              <tr><th>Service</th><th class="text-right">Revenue</th><th class="text-right">Share</th></tr>
              ${serviceData.revenueContribution.revenueByService.slice(0, 10).map(s => 
                `<tr><td>${s.name}</td><td class="text-right text-green">${formatCurrency(s.revenue)}</td><td class="text-right">${s.percentage}%</td></tr>`
              ).join('')}
            </table>
          </div>

          <div class="section">
            <div class="section-title">Peak Demand Times</div>
            <table>
              <tr><th>Service</th><th class="text-right">Peak Hour</th><th class="text-right">Peak Day</th></tr>
              ${serviceData.demandPatterns.peakHours.map(s => 
                `<tr><td>${s.name}</td><td class="text-right text-blue">${s.peakHour}</td><td class="text-right">${s.peakDay}</td></tr>`
              ).join('')}
            </table>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Staff Workload Distribution</div>
          <table>
            <tr><th>Staff Member</th><th class="text-right">Total Books</th><th class="text-right">Pickup</th><th class="text-right">Processing</th><th class="text-right">Delivery</th></tr>
            ${serviceData.staffEfficiency.workloadDistribution.map(s => 
              `<tr><td>${s.name}</td><td class="text-right">${s.totalOrders}</td><td class="text-right">${s.roleDistribution.pickup}</td><td class="text-right">${s.roleDistribution.processing}</td><td class="text-right">${s.roleDistribution.delivery}</td></tr>`
            ).join('')}
          </table>
        </div>

        ${serviceData.demandPatterns.monthlyTrend && serviceData.demandPatterns.monthlyTrend.length > 0 ? `
        <div class="section">
          <div class="section-title">Monthly Service Trends</div>
          <table>
            <tr><th>Month</th><th class="text-right">Books</th><th class="text-right">Revenue</th></tr>
            ${serviceData.demandPatterns.monthlyTrend.slice(-12).map(t => 
              `<tr><td>${t.month}</td><td class="text-right">${t.totalOrders}</td><td class="text-right text-green">${formatCurrency(t.totalRevenue)}</td></tr>`
            ).join('')}
          </table>
        </div>` : ''}

        <div class="footer">
          Laundry Planet &mdash; Service Report &mdash; Confidential &mdash; Generated on ${new Date().toLocaleString('en-PH')}
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
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
                <div className="p-3 rounded-lg bg-info/10">
                  <Package className="text-info" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Service Report</h1>
                  <p className="text-base-content/60">Service performance and analytics</p>
                </div>
              </div>
              <button
                onClick={handlePrint}
                className="btn btn-primary gap-2"
                disabled={!serviceData || loading}
              >
                <Printer size={18} />
                Export PDF / Print
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
                  <div className="stat-title text-info-content/80">Total Service Books</div>
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
                  <div className="stat-title text-warning-content/80">Avg Books/Service</div>
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
                            <th>Books</th>
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
                          <th>Total Books</th>
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
                          <th>Total Books</th>
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
                            <th>Total Books</th>
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


