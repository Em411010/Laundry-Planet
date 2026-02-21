import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import { AdminSidebar, AdminNavbar } from '../components/navbars/AdminNavbar'
import { userAPI, auditAPI, orderAPI } from '../services/api'
import { Users, UserPlus, Search, Filter, Trash2, Power, PowerOff, Eye, Edit, AlertCircle, FileText, ShoppingBag, History, X, Calendar, MapPin, Phone, Mail as MailIcon, User as UserIcon, Download, CreditCard, XCircle } from 'lucide-react'

const UserManagement = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Pagination & Filters
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // Modals & Forms
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [detailsTab, setDetailsTab] = useState('profile') // profile, orders, audit
  
  // User details data
  const [userOrders, setUserOrders] = useState([])
  const [userAuditLogs, setUserAuditLogs] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'client'
  })

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
      fetchUsers()
    }
  }, [user, page, search, roleFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await userAPI.getAllUsers({
        page,
        limit,
        search,
        role: roleFilter,
        isActive: statusFilter
      })
      setUsers(response.data)
      setTotal(response.pagination.total)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      await userAPI.createUser(formData)
      setShowCreateModal(false)
      setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'client' })
      fetchUsers()
      toast.success('User created successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user')
    }
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    try {
      await userAPI.updateUser(selectedUser._id, formData)
      setShowEditModal(false)
      setSelectedUser(null)
      setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'client' })
      fetchUsers()
      toast.success('User updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user')
    }
  }

  const handleDeleteUser = async () => {
    try {
      await userAPI.deleteUser(selectedUser._id)
      setShowDeleteModal(false)
      setSelectedUser(null)
      fetchUsers()
      toast.success('User deleted successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleToggleStatus = async (userId) => {
    try {
      await userAPI.toggleUserStatus(userId)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle user status')
    }
  }

  const handleBulkToggle = async (isActive) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first')
      return
    }
    try {
      await userAPI.bulkToggleStatus(selectedUsers, isActive)
      setSelectedUsers([])
      fetchUsers()
      toast.success(`${selectedUsers.length} users ${isActive ? 'activated' : 'deactivated'}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to perform bulk action')
    }
  }

  const openEditModal = (userData) => {
    setSelectedUser(userData)
    setFormData({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role,
      password: ''
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (userData) => {
    setSelectedUser(userData)
    setShowDeleteModal(true)
  }

  const openDetailsModal = async (userData) => {
    setSelectedUser(userData)
    setShowDetailsModal(true)
    setDetailsTab('profile')
    await fetchUserDetails(userData._id)
  }

  const fetchUserDetails = async (userId) => {
    try {
      setLoadingDetails(true)
      
      // Fetch user orders
      const ordersResponse = await orderAPI.getAllOrders({ userId })
      setUserOrders(ordersResponse.data || [])
      
      // Fetch user audit logs
      const auditResponse = await auditAPI.getAllAuditLogs({ userId, limit: 50 })
      setUserAuditLogs(auditResponse.data || [])
    } catch (err) {
      console.error('Error fetching user details:', err)
      toast.error('Failed to load user details')
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleDownloadReceipt = (order) => {
    try {
      const doc = new jsPDF({ unit: 'pt' })
      doc.setFontSize(16)
      doc.text('Laundry Planet', 40, 50)
      doc.setFontSize(10)
      doc.text(`Receipt - ${order.orderNumber}`, 40, 70)
      doc.setLineWidth(0.5)
      doc.line(40, 78, 560, 78)

      doc.setFontSize(11)
      let y = 100
      doc.text(`Customer: ${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`, 40, y)
      y += 16
      doc.text(`Email: ${order.customer?.email || ''}`, 40, y)
      y += 20
      doc.text(`Delivery: ${order.deliverDate ? new Date(order.deliverDate).toLocaleDateString() : 'N/A'} ${order.deliverTime || ''}`, 40, y)
      y += 20
      doc.text(`Payment: ${order.paymentMethod.toUpperCase()}`, 40, y)
      
      if (order.paymentMethod === 'gcash' && order.paymentDetails?.gcashReferenceNumber) {
        y += 16
        doc.text(`GCash Ref: ${order.paymentDetails.gcashReferenceNumber}`, 40, y)
      }
      
      if (order.paymentReceiver) {
        y += 16
        doc.text(`Received By: ${order.paymentReceiver.firstName} ${order.paymentReceiver.lastName}`, 40, y)
      }

      y += 24
      doc.text('Services', 40, y)
      y += 12
      doc.setFontSize(10)
      ;(order.services || []).forEach((s) => {
        doc.text(`${s.service?.name || 'Service'} - ${s.quantity} ${s.service?.unit || ''}`, 40, y)
        doc.text(`₱${s.subtotal.toFixed(2)}`, 480, y, { align: 'right' })
        y += 14
      })

      y += 8
      doc.setFontSize(12)
      doc.text(`Total: ₱${order.totalAmount.toFixed(2)}`, 480, y, { align: 'right' })

      doc.save(`Receipt_${order.orderNumber}.pdf`)
      toast.success('Receipt downloaded successfully')
    } catch (err) {
      console.error('Receipt generation failed:', err)
      toast.error('Failed to generate receipt')
    }
  }

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  if (!user) return null

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <AdminSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <AdminNavbar toggleSidebar={toggleSidebar} />

      <div className="lg:ml-64 pt-28 md:pt-32 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">User Management</h1>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary gap-2"
            >
              <UserPlus className="h-5 w-5" />
              Create User
            </button>
          </div><div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4"><div className="join w-full">
                  <input 
                    type="text"
                    placeholder="Search by name or email"
                    className="input input-bordered join-item w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button className="btn btn-primary join-item">
                    <Search className="h-5 w-5" />
                  </button>
                </div><select 
                  className="select select-bordered w-full"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="client">Client</option>
                </select><select 
                  className="select select-bordered w-full"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select><div className="dropdown dropdown-end w-full">
                  <button 
                    tabIndex={0} 
                    className="btn btn-outline w-full gap-2"
                    disabled={selectedUsers.length === 0}
                  >
                    <Filter className="h-5 w-5" />
                    Bulk Actions ({selectedUsers.length})
                  </button>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li><a onClick={() => handleBulkToggle(true)}>
                      <Power className="h-4 w-4" /> Activate Selected
                    </a></li>
                    <li><a onClick={() => handleBulkToggle(false)}>
                      <PowerOff className="h-4 w-4" /> Deactivate Selected
                    </a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>
                        <input 
                          type="checkbox" 
                          className="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(users.map(u => u._id))
                            } else {
                              setSelectedUsers([])
                            }
                          }}
                        />
                      </th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8">
                          <span className="loading loading-spinner loading-lg"></span>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-base-content/60">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((userData) => (
                        <tr key={userData._id}>
                          <td>
                            <input 
                              type="checkbox" 
                              className="checkbox"
                              checked={selectedUsers.includes(userData._id)}
                              onChange={() => toggleUserSelection(userData._id)}
                            />
                          </td>
                          <td>
                            <div className="font-semibold">
                              {userData.firstName} {userData.lastName}
                            </div>
                          </td>
                          <td>{userData.email}</td>
                          <td>
                            <div className={`badge ${
                              userData.role === 'admin' ? 'badge-error' :
                              userData.role === 'staff' ? 'badge-warning' :
                              'badge-info'
                            }`}>
                              {userData.role}
                            </div>
                          </td>
                          <td>
                            <div className={`badge ${userData.isActive ? 'badge-success' : 'badge-ghost'}`}>
                              {userData.isActive ? 'Active' : 'Inactive'}
                            </div>
                          </td>
                          <td>{new Date(userData.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className="flex gap-2">
                              <div className="tooltip" data-tip="View Details">
                                <button 
                                  className="btn btn-sm btn-ghost"
                                  onClick={() => openDetailsModal(userData)}
                                >
                                  <Eye className="h-4 w-4 text-info" />
                                </button>
                              </div>
                              <div className="tooltip" data-tip="Edit User">
                                <button 
                                  className="btn btn-sm btn-ghost"
                                  onClick={() => openEditModal(userData)}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="tooltip" data-tip={userData.isActive ? 'Deactivate' : 'Activate'}>
                                <button 
                                  className="btn btn-sm btn-ghost"
                                  onClick={() => handleToggleStatus(userData._id)}
                                >
                                  {userData.isActive ? (
                                    <PowerOff className="h-4 w-4 text-warning" />
                                  ) : (
                                    <Power className="h-4 w-4 text-success" />
                                  )}
                                </button>
                              </div>
                              <div className="tooltip" data-tip="Delete User">
                                <button 
                                  className="btn btn-sm btn-ghost text-error"
                                  onClick={() => openDeleteModal(userData)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
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
      </div>{showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">First Name</span></label>
                <input 
                  type="text" 
                  className="input input-bordered"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Last Name</span></label>
                <input 
                  type="text" 
                  className="input input-bordered"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Email</span></label>
                <input 
                  type="email" 
                  className="input input-bordered"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Password</span></label>
                <input 
                  type="password" 
                  className="input input-bordered"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  minLength={8}
                />
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Role</span></label>
                <select 
                  className="select select-bordered"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="client">Client</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}></div>
        </div>
      )}{showEditModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Edit User</h3>
            <form onSubmit={handleUpdateUser}>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">First Name</span></label>
                <input 
                  type="text" 
                  className="input input-bordered"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Last Name</span></label>
                <input 
                  type="text" 
                  className="input input-bordered"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Email</span></label>
                <input 
                  type="email" 
                  className="input input-bordered"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Role</span></label>
                <select 
                  className="select select-bordered"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="client">Client</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update</button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowEditModal(false)}></div>
        </div>
      )}{showDeleteModal && selectedUser && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4 text-error">Delete User</h3>
            <p className="mb-4">
              Are you sure you want to permanently delete <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-error" onClick={handleDeleteUser}>Delete</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}></div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="modal modal-open">
          <div className="modal-box max-w-6xl h-[90vh] p-0 overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 bg-base-100 border-b border-base-300 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content rounded-full w-16">
                    <span className="text-2xl">{selectedUser.firstName[0]}{selectedUser.lastName[0]}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-2xl">{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`badge ${
                      selectedUser.role === 'admin' ? 'badge-error' :
                      selectedUser.role === 'staff' ? 'badge-warning' :
                      'badge-info'
                    }`}>
                      {selectedUser.role}
                    </div>
                    <div className={`badge ${selectedUser.isActive ? 'badge-success' : 'badge-ghost'}`}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </div>
              <button 
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setShowDetailsModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="tabs tabs-boxed bg-base-100 px-6 pt-4">
              <a 
                className={`tab tab-lg ${detailsTab === 'profile' ? 'tab-active' : ''}`}
                onClick={() => setDetailsTab('profile')}
              >
                <UserIcon size={16} className="mr-2" />
                Profile
              </a>
              <a 
                className={`tab tab-lg ${detailsTab === 'orders' ? 'tab-active' : ''}`}
                onClick={() => setDetailsTab('orders')}
              >
                <ShoppingBag size={16} className="mr-2" />
                Orders ({userOrders.length})
              </a>
              <a 
                className={`tab tab-lg ${detailsTab === 'audit' ? 'tab-active' : ''}`}
                onClick={() => setDetailsTab('audit')}
              >
                <History size={16} className="mr-2" />
                Activity Logs
              </a>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {loadingDetails ? (
                <div className="flex justify-center items-center py-12">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <>
                  {/* Profile Tab */}
                  {detailsTab === 'profile' && (
                    <div className="space-y-6">
                      {/* Contact Information */}
                      <div className="card bg-base-200">
                        <div className="card-body">
                          <h4 className="card-title text-lg mb-4">Contact Information</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                              <MailIcon size={20} className="text-base-content/60" />
                              <div>
                                <div className="text-xs text-base-content/60">Email</div>
                                <div className="font-semibold">{selectedUser.email}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Phone size={20} className="text-base-content/60" />
                              <div>
                                <div className="text-xs text-base-content/60">Phone</div>
                                <div className="font-semibold">{selectedUser.phone || 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Address Information */}
                      {selectedUser.address && (
                        <div className="card bg-base-200">
                          <div className="card-body">
                            <h4 className="card-title text-lg mb-4">Address</h4>
                            <div className="flex items-start gap-3">
                              <MapPin size={20} className="text-base-content/60 mt-1" />
                              <div>
                                <div className="font-semibold">{selectedUser.address.street}</div>
                                <div className="text-sm text-base-content/60">
                                  {selectedUser.address.barangay}, {selectedUser.address.city}
                                </div>
                                <div className="text-sm text-base-content/60">
                                  {selectedUser.address.province}, {selectedUser.address.zipCode}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Account Information */}
                      <div className="card bg-base-200">
                        <div className="card-body">
                          <h4 className="card-title text-lg mb-4">Account Information</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                              <Calendar size={20} className="text-base-content/60" />
                              <div>
                                <div className="text-xs text-base-content/60">Member Since</div>
                                <div className="font-semibold">
                                  {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Calendar size={20} className="text-base-content/60" />
                              <div>
                                <div className="text-xs text-base-content/60">Last Updated</div>
                                <div className="font-semibold">
                                  {new Date(selectedUser.updatedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Orders Tab */}
                  {detailsTab === 'orders' && (
                    <div className="space-y-4">
                      {userOrders.length === 0 ? (
                        <div className="text-center py-12">
                          <ShoppingBag size={48} className="mx-auto text-base-content/30 mb-4" />
                          <p className="text-base-content/60">No orders found</p>
                        </div>
                      ) : (
                        userOrders.map((order) => (
                          <div key={order._id} className="card bg-base-200">
                            <div className="card-body">
                              {/* Order Header */}
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h4 className="font-bold text-lg">{order.orderNumber}</h4>
                                  <p className="text-sm text-base-content/60">
                                    {new Date(order.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <div className={`badge badge-lg ${
                                  order.status === 'delivered' ? 'badge-success' :
                                  order.status === 'cancelled' ? 'badge-error' :
                                  order.status === 'in-progress' ? 'badge-info' :
                                  'badge-warning'
                                }`}>
                                  {order.status}
                                </div>
                              </div>

                              {/* Services */}
                              <div className="mb-4">
                                <h5 className="font-semibold mb-2">Services:</h5>
                                <div className="space-y-2">
                                  {order.services.map((service, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-base-300 p-2 rounded">
                                      <div>
                                        <div className="font-medium">{service.service?.name || 'Unknown Service'}</div>
                                        <div className="text-sm text-base-content/60">
                                          Qty: {service.quantity} × ₱{service.price}
                                        </div>
                                      </div>
                                      <div className="font-bold">₱{service.subtotal}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Order Details */}
                              <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <div className="text-xs text-base-content/60">Weight</div>
                                  <div className="font-semibold">{order.actualWeight || 'N/A'} kg</div>
                                </div>
                                <div>
                                  <div className="text-xs text-base-content/60">Payment Method</div>
                                  <div className="font-semibold capitalize">{order.paymentMethod}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-base-content/60">Payment Status</div>
                                  <div className={`badge ${
                                    order.paymentStatus === 'paid' ? 'badge-success' :
                                    order.paymentStatus === 'pending' ? 'badge-warning' :
                                    'badge-error'
                                  }`}>
                                    {order.paymentStatus}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-base-content/60">Assigned Staff</div>
                                  <div className="font-semibold">
                                    {order.assignedStaff?.pickup || order.assignedStaff?.processing || order.assignedStaff?.delivery ? 
                                      `${(order.assignedStaff.pickup || order.assignedStaff.processing || order.assignedStaff.delivery).firstName} ${(order.assignedStaff.pickup || order.assignedStaff.processing || order.assignedStaff.delivery).lastName}` : 
                                      'Not assigned'}
                                  </div>
                                </div>
                              </div>

                              {/* GCash Payment Details */}
                              {order.paymentMethod === 'gcash' && order.paymentDetails && (
                                <div className="mb-4 p-4 bg-success/10 border border-success/20 rounded-lg">
                                  <h5 className="font-semibold mb-3 flex items-center gap-2">
                                    <CreditCard size={16} className="text-success" />
                                    GCash Payment Details
                                  </h5>
                                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                                    {order.paymentDetails.gcashReferenceNumber && (
                                      <div>
                                        <div className="text-xs text-base-content/60">Reference Number</div>
                                        <div className="font-mono font-semibold">{order.paymentDetails.gcashReferenceNumber}</div>
                                      </div>
                                    )}
                                    {order.paymentDetails.paymongoSourceId && (
                                      <div>
                                        <div className="text-xs text-base-content/60">PayMongo Source ID</div>
                                        <div className="font-mono text-xs">{order.paymentDetails.paymongoSourceId}</div>
                                      </div>
                                    )}
                                    {order.paymentDetails.paymongoPaymentId && (
                                      <div>
                                        <div className="text-xs text-base-content/60">PayMongo Payment ID</div>
                                        <div className="font-mono text-xs">{order.paymentDetails.paymongoPaymentId}</div>
                                      </div>
                                    )}
                                    {order.paymentDetails.paidAt && (
                                      <div>
                                        <div className="text-xs text-base-content/60">Paid At</div>
                                        <div className="font-semibold">{new Date(order.paymentDetails.paidAt).toLocaleString()}</div>
                                      </div>
                                    )}
                                    {order.paymentDetails.failedAt && (
                                      <div>
                                        <div className="text-xs text-base-content/60">Failed At</div>
                                        <div className="font-semibold text-error">{new Date(order.paymentDetails.failedAt).toLocaleString()}</div>
                                      </div>
                                    )}
                                    {order.paymentDetails.failureReason && (
                                      <div className="md:col-span-2">
                                        <div className="text-xs text-base-content/60">Failure Reason</div>
                                        <div className="font-semibold text-error">{order.paymentDetails.failureReason}</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Receipt Summary */}
                              <div className="border-t border-base-300 pt-4">
                                <div className="flex justify-between mb-2">
                                  <span>Subtotal:</span>
                                  <span className="font-semibold">₱{order.servicesSubtotal || 0}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                  <span>Shipping Fee:</span>
                                  <span className="font-semibold">₱{order.shippingFee || 0}</span>
                                </div>
                                {order.discount > 0 && (
                                  <div className="flex justify-between mb-2 text-success">
                                    <span>Discount:</span>
                                    <span className="font-semibold">-₱{order.discount}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-lg font-bold border-t border-base-300 pt-2">
                                  <span>Total:</span>
                                  <span className="text-primary">₱{order.totalAmount}</span>
                                </div>
                              </div>

                              {/* Cancellation Reason */}
                              {order.status === 'cancelled' && order.notes && order.notes.length > 0 && (() => {
                                const cancellationNote = order.notes.find(n => n.note?.startsWith('Cancellation reason:'))
                                if (cancellationNote) {
                                  const reason = cancellationNote.note.replace('Cancellation reason: ', '')
                                  return (
                                    <div className="mt-4 p-3 bg-error/10 border border-error/30 rounded">
                                      <div className="text-xs text-base-content/60 mb-1 flex items-center gap-1">
                                        <XCircle size={12} className="text-error" />
                                        Cancellation Reason:
                                      </div>
                                      <div className="text-sm">{reason || 'No reason provided'}</div>
                                      {cancellationNote.timestamp && (
                                        <div className="text-xs text-base-content/60 mt-1">
                                          {new Date(cancellationNote.timestamp).toLocaleString()}
                                        </div>
                                      )}
                                    </div>
                                  )
                                }
                                return null
                              })()}

                              {/* Special Instructions */}
                              {order.specialInstructions && (
                                <div className="mt-4 p-3 bg-base-300 rounded">
                                  <div className="text-xs text-base-content/60 mb-1">Special Instructions:</div>
                                  <div className="text-sm">{order.specialInstructions}</div>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="mt-4 flex gap-2">
                                <button
                                  onClick={() => handleDownloadReceipt(order)}
                                  className="btn btn-sm btn-primary gap-2"
                                >
                                  <Download size={16} />
                                  Download Receipt
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Audit Logs Tab */}
                  {detailsTab === 'audit' && (
                    <div className="space-y-3">
                      {userAuditLogs.length === 0 ? (
                        <div className="text-center py-12">
                          <History size={48} className="mx-auto text-base-content/30 mb-4" />
                          <p className="text-base-content/60">No activity logs found</p>
                        </div>
                      ) : (
                        userAuditLogs.map((log) => (
                          <div key={log._id} className="card bg-base-200">
                            <div className="card-body p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className={`badge ${
                                      log.action.includes('create') ? 'badge-success' :
                                      log.action.includes('delete') ? 'badge-error' :
                                      log.action.includes('update') ? 'badge-warning' :
                                      'badge-info'
                                    }`}>
                                      {log.action}
                                    </div>
                                    <span className="text-sm text-base-content/60">{log.module}</span>
                                  </div>
                                  <p className="text-sm mb-2">{log.description}</p>
                                  {log.details && Object.keys(log.details).length > 0 && (
                                    <div className="text-xs text-base-content/60 bg-base-300 p-2 rounded mt-2">
                                      <pre className="whitespace-pre-wrap">
                                        {JSON.stringify(log.details, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-base-content/60 text-right">
                                  {new Date(log.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowDetailsModal(false)}></div>
        </div>
      )}
    </div>
  )
}

export default UserManagement


