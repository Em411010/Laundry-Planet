import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminSidebar, AdminNavbar } from '../../components/navbars/AdminNavbar'
import { serviceAPI } from '../../services/api'
import { Package, DollarSign, Edit, Power, PowerOff, AlertCircle, Save, X } from 'lucide-react'

const ServicesPricing = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingService, setEditingService] = useState(null)
  const [newPrice, setNewPrice] = useState('')

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
      fetchServices()
    }
  }, [user])

  const fetchServices = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await serviceAPI.getAllServices()
      setServices(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch services')
      console.error('Error fetching services:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (service) => {
    setEditingService(service._id)
    setNewPrice(service.price.toString())
  }

  const handleCancelEdit = () => {
    setEditingService(null)
    setNewPrice('')
  }

  const handleSavePrice = async (serviceId) => {
    try {
      const priceValue = parseFloat(newPrice)
      if (isNaN(priceValue) || priceValue < 0) {
        alert('Please enter a valid price')
        return
      }

      await serviceAPI.updateServicePrice(serviceId, priceValue)
      setEditingService(null)
      setNewPrice('')
      fetchServices()
      alert('Price updated successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update price')
    }
  }

  const handleToggleStatus = async (serviceId) => {
    try {
      await serviceAPI.toggleServiceStatus(serviceId)
      fetchServices()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle service status')
    }
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'Full Package':
        return 'badge-primary'
      case 'Dry Service':
        return 'badge-secondary'
      case 'Delivery':
        return 'badge-accent'
      default:
        return 'badge-ghost'
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <AdminSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <AdminNavbar toggleSidebar={toggleSidebar} />

      <div className="lg:ml-64 pt-20 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
    
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-10">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Services & Pricing</h1>
            </div>
            <div className="badge badge-info gap-2">
              <DollarSign className="h-4 w-4" />
              Price Management
            </div>
          </div><div className="alert alert-info mb-6">
            <AlertCircle className="h-5 w-5" />
            <div>
              <span className="font-semibold">Note:</span> Service names and descriptions are fixed. 
              You can only modify prices and activate/deactivate services.
            </div>
          </div><div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h3 className="card-title text-lg">General Service Information</h3>
              <div className="grid md:grid-cols-2 gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="badge badge-outline">Default Minimum</div>
                  <span className="text-sm">4kgs per load for most services</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="badge badge-outline">Delivery</div>
                  <span className="text-sm">Free within 1km radius (min 6kgs)</span>
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
                      <th>Service Name</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Price</th>
                      <th>Unit</th>
                      <th>Requirements</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="text-center py-8">
                          <span className="loading loading-spinner loading-lg"></span>
                        </td>
                      </tr>
                    ) : services.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-8 text-base-content/60">
                          No services found
                        </td>
                      </tr>
                    ) : (
                      services.map((service) => (
                        <tr key={service._id}>
                          <td>
                            <div className="font-semibold">{service.name}</div>
                          </td>
                          <td>
                            <div className={`badge ${getCategoryBadgeClass(service.category)}`}>
                              {service.category}
                            </div>
                          </td>
                          <td>
                            <div className="text-sm text-base-content/70">{service.description}</div>
                          </td>
                          <td>
                            {editingService === service._id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-lg">₱</span>
                                <input
                                  type="number"
                                  className="input input-bordered input-sm w-24"
                                  value={newPrice}
                                  onChange={(e) => setNewPrice(e.target.value)}
                                  min="0"
                                  step="1"
                                />
                              </div>
                            ) : (
                              <div className="text-xl font-bold text-primary">
                                {service.unit === 'FREE' ? 'FREE' : `₱${service.price}`}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="badge badge-outline badge-sm">{service.unit}</div>
                          </td>
                          <td>
                            <div className="text-xs text-base-content/60">{service.minRequirement}</div>
                          </td>
                          <td>
                            <div className={`badge ${service.isActive ? 'badge-success' : 'badge-ghost'}`}>
                              {service.isActive ? 'Active' : 'Inactive'}
                            </div>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              {editingService === service._id ? (
                                <>
                                  <div className="tooltip" data-tip="Save Price">
                                    <button
                                      className="btn btn-sm btn-success"
                                      onClick={() => handleSavePrice(service._id)}
                                    >
                                      <Save className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <div className="tooltip" data-tip="Cancel">
                                    <button
                                      className="btn btn-sm btn-ghost"
                                      onClick={handleCancelEdit}
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="tooltip" data-tip="Edit Price">
                                    <button
                                      className="btn btn-sm btn-ghost"
                                      onClick={() => handleEditClick(service)}
                                      disabled={service.unit === 'FREE'}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <div className="tooltip" data-tip={service.isActive ? 'Deactivate' : 'Activate'}>
                                    <button
                                      className="btn btn-sm btn-ghost"
                                      onClick={() => handleToggleStatus(service._id)}
                                    >
                                      {service.isActive ? (
                                        <PowerOff className="h-4 w-4 text-warning" />
                                      ) : (
                                        <Power className="h-4 w-4 text-success" />
                                      )}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div><div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="stat bg-base-100 shadow-xl rounded-box">
              <div className="stat-figure text-primary">
                <Package className="h-8 w-8" />
              </div>
              <div className="stat-title">Total Services</div>
              <div className="stat-value text-primary">{services.length}</div>
            </div>
            <div className="stat bg-base-100 shadow-xl rounded-box">
              <div className="stat-figure text-success">
                <Power className="h-8 w-8" />
              </div>
              <div className="stat-title">Active Services</div>
              <div className="stat-value text-success">
                {services.filter(s => s.isActive).length}
              </div>
            </div>
            <div className="stat bg-base-100 shadow-xl rounded-box">
              <div className="stat-figure text-warning">
                <PowerOff className="h-8 w-8" />
              </div>
              <div className="stat-title">Inactive Services</div>
              <div className="stat-value text-warning">
                {services.filter(s => !s.isActive).length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServicesPricing
