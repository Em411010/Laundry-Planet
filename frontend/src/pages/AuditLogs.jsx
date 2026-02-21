import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AdminSidebar, AdminNavbar } from '../components/navbars/AdminNavbar'
import { auditAPI } from '../services/api'
import { FileSearch, Filter, Calendar, User, Activity, AlertCircle } from 'lucide-react'

const AuditLogs = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Pagination & Filters
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)
  const [actionFilter, setActionFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Stats
  const [stats, setStats] = useState(null)

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
      fetchLogs()
      fetchStats()
    }
  }, [user, page, actionFilter, startDate, endDate])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await auditAPI.getAllAuditLogs({
        page,
        limit,
        action: actionFilter,
        startDate,
        endDate
      })
      setLogs(response.data)
      setTotal(response.pagination.total)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch audit logs')
      console.error('Error fetching audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await auditAPI.getAuditStats()
      setStats(response.data)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const getActionBadgeClass = (action) => {
    switch (action) {
      // User Management
      case 'USER_CREATED':
      case 'user_registered':
      case 'USER_ACTIVATED':
        return 'badge-success'
      case 'USER_UPDATED':
      case 'profile_updated':
        return 'badge-info'
      case 'USER_DELETED':
        return 'badge-error'
      case 'USER_DEACTIVATED':
        return 'badge-warning'
      case 'ROLE_CHANGED':
        return 'badge-primary'
      
      // Authentication
      case 'user_login':
        return 'badge-success'
      case 'email_verified':
        return 'badge-success'
      
      // Orders
      case 'order_created':
      case 'walk_in_order_created':
        return 'badge-success'
      case 'order_status_updated':
      case 'order_accepted':
        return 'badge-info'
      case 'order_cancelled':
        return 'badge-error'
      case 'order_revived':
        return 'badge-success'
      case 'order_weight_updated':
        return 'badge-warning'
      case 'order_image_added':
        return 'badge-info'
      case 'staff_assigned':
        return 'badge-primary'
      
      // Payments
      case 'gcash_payment_initiated':
        return 'badge-info'
      case 'gcash_payment_completed':
      case 'gcash_payment_webhook_completed':
        return 'badge-success'
      case 'gcash_payment_failed':
      case 'gcash_payment_webhook_failed':
        return 'badge-error'
      case 'gcash_payment_retry':
        return 'badge-warning'
      
      // Services
      case 'PRICE_UPDATED':
        return 'badge-accent'
      case 'SERVICE_STATUS_CHANGED':
      case 'SERVICE_CREATED':
      case 'SERVICE_DELETED':
        return 'badge-secondary'
      
      default:
        return 'badge-ghost'
    }
  }

  const formatActionName = (action) => {
    return action.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatChanges = (changes) => {
    if (!changes || Object.keys(changes).length === 0) return 'No details'
    
    return Object.entries(changes).map(([key, value]) => {
      if (typeof value === 'object' && value.from !== undefined) {
        return `${key}: ${value.from} → ${value.to}`
      }
      return `${key}: ${JSON.stringify(value)}`
    }).join(', ')
  }

  if (!user) return null

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <AdminSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <AdminNavbar toggleSidebar={toggleSidebar} />

      <div className="lg:ml-64 pt-28 md:pt-32 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-2">
            <div className="flex items-center gap-3">
              <FileSearch className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Audit Logs</h1>
            </div>
            <div className="badge badge-info gap-2">
              <Activity className="h-4 w-4" />
              System Activity
            </div>
          </div>{stats && (
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="stat bg-base-100 shadow-xl rounded-box">
                <div className="stat-figure text-primary">
                  <FileSearch className="h-8 w-8" />
                </div>
                <div className="stat-title">Total Logs</div>
                <div className="stat-value text-primary">{stats.totalLogs}</div>
              </div>
              <div className="stat bg-base-100 shadow-xl rounded-box">
                <div className="stat-figure text-success">
                  <Activity className="h-8 w-8" />
                </div>
                <div className="stat-title">Action Types</div>
                <div className="stat-value text-success">{stats.actionBreakdown.length}</div>
              </div>
              <div className="stat bg-base-100 shadow-xl rounded-box">
                <div className="stat-figure text-accent">
                  <Calendar className="h-8 w-8" />
                </div>
                <div className="stat-title">Recent Activity</div>
                <div className="stat-value text-accent">{stats.recentActivity.length}</div>
              </div>
            </div>
          )}<div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="form-control">
                  <label className="label">
                    <span className="label-text">Filter by Action</span>
                  </label>
                  <select 
                    className="select select-bordered w-full"
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                  >
                    <option value="">All Actions</option>
                    <optgroup label="User Management">
                      <option value="USER_CREATED">User Created</option>
                      <option value="user_registered">User Registered</option>
                      <option value="USER_UPDATED">User Updated</option>
                      <option value="profile_updated">Profile Updated</option>
                      <option value="USER_DELETED">User Deleted</option>
                      <option value="USER_ACTIVATED">User Activated</option>
                      <option value="USER_DEACTIVATED">User Deactivated</option>
                      <option value="ROLE_CHANGED">Role Changed</option>
                    </optgroup>
                    <optgroup label="Authentication">
                      <option value="user_login">User Login</option>
                      <option value="email_verified">Email Verified</option>
                    </optgroup>
                    <optgroup label="Orders">
                      <option value="order_created">Order Created</option>
                      <option value="walk_in_order_created">Walk-in Order Created</option>
                      <option value="order_status_updated">Order Status Updated</option>
                      <option value="order_accepted">Order Accepted</option>
                      <option value="order_cancelled">Order Cancelled</option>
                      <option value="order_revived">Order Revived</option>
                      <option value="order_weight_updated">Weight Updated</option>
                      <option value="order_image_added">Image Added</option>
                      <option value="staff_assigned">Staff Assigned</option>
                    </optgroup>
                    <optgroup label="Services">
                      <option value="SERVICE_CREATED">Service Created</option>
                      <option value="SERVICE_DELETED">Service Deleted</option>
                      <option value="PRICE_UPDATED">Price Updated</option>
                      <option value="SERVICE_STATUS_CHANGED">Service Status Changed</option>
                    </optgroup>
                    <optgroup label="Payments">
                      <option value="gcash_payment_initiated">GCash Payment Initiated</option>
                      <option value="gcash_payment_completed">GCash Payment Completed</option>
                      <option value="gcash_payment_failed">GCash Payment Failed</option>
                      <option value="gcash_payment_retry">GCash Payment Retry</option>
                    </optgroup>
                  </select>
                </div><div className="form-control">
                  <label className="label">
                    <span className="label-text">Start Date</span>
                  </label>
                  <input 
                    type="date"
                    className="input input-bordered w-full"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div><div className="form-control">
                  <label className="label">
                    <span className="label-text">End Date</span>
                  </label>
                  <input 
                    type="date"
                    className="input input-bordered w-full"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={fetchLogs}
                >
                  <Filter className="h-4 w-4" />
                  Apply Filters
                </button>
                <button 
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setActionFilter('')
                    setStartDate('')
                    setEndDate('')
                    setPage(1)
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Action</th>
                      <th>Performed By</th>
                      <th>Target User</th>
                      <th>Changes</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8">
                          <span className="loading loading-spinner loading-lg"></span>
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-base-content/60">
                          No audit logs found
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log._id}>
                          <td>
                            <div className="text-sm">
                              {new Date(log.createdAt).toLocaleString()}
                            </div>
                          </td>
                          <td>
                            <div className={`badge ${getActionBadgeClass(log.action)}`}>
                              {formatActionName(log.action)}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <div>
                                <div className="font-semibold text-sm">
                                  {log.performedBy?.firstName} {log.performedBy?.lastName}
                                </div>
                                <div className="text-xs text-base-content/60">
                                  {log.performedBy?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {log.targetUser ? (
                              <div>
                                <div className="font-semibold text-sm">
                                  {log.targetUser?.firstName} {log.targetUser?.lastName}
                                </div>
                                <div className="text-xs text-base-content/60">
                                  {log.targetUser?.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-base-content/40">N/A</span>
                            )}
                          </td>
                          <td>
                            <div className="text-xs max-w-xs truncate" title={formatChanges(log.changes)}>
                              {formatChanges(log.changes)}
                            </div>
                          </td>
                          <td>
                            <div className="text-xs text-base-content/60">
                              {log.ipAddress || 'N/A'}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>{totalPages > 1 && (
                <div className="flex justify-center gap-2 p-4">
                  <button 
                    className="btn btn-sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                  </div>
                  <button 
                    className="btn btn-sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuditLogs


