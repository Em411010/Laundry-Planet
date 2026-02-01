import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminSidebar, AdminNavbar } from '../../components/navbars/AdminNavbar'
import { userAPI } from '../../services/api'
import { Users, UserPlus, Search, Filter, Trash2, Power, PowerOff, Eye, Edit, AlertCircle } from 'lucide-react'

const UserManagement = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
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
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState([])
  
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
      setError(null)
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
      setError(err.response?.data?.message || 'Failed to fetch users')
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
      alert('User created successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user')
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
      alert('User updated successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user')
    }
  }

  const handleDeleteUser = async () => {
    try {
      await userAPI.deleteUser(selectedUser._id)
      setShowDeleteModal(false)
      setSelectedUser(null)
      fetchUsers()
      alert('User deleted successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleToggleStatus = async (userId) => {
    try {
      await userAPI.toggleUserStatus(userId)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle user status')
    }
  }

  const handleBulkToggle = async (isActive) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first')
      return
    }
    try {
      await userAPI.bulkToggleStatus(selectedUsers, isActive)
      setSelectedUsers([])
      fetchUsers()
      alert(`${selectedUsers.length} users ${isActive ? 'activated' : 'deactivated'}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to perform bulk action')
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

      <div className="lg:ml-64 pt-32 mt-12 p-4 md:p-8">
        <div className="max-w-7xl mx-auto"><div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-10">
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
          </div>{error && (
            <div className="alert alert-error mb-6">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}<div className="card bg-base-100 shadow-xl">
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
    </div>
  )
}

export default UserManagement
