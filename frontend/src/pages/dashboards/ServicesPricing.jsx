import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AdminSidebar, AdminNavbar } from '../../components/navbars/AdminNavbar'
import { serviceAPI, settingsAPI } from '../../services/api'
import { Package, DollarSign, Edit, Power, PowerOff, AlertCircle, Save, X, Plus, Trash2, Truck } from 'lucide-react'

const ServicesPricing = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingService, setEditingService] = useState(null)
  const [newPrice, setNewPrice] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    name: '',
    category: 'Full Package',
    description: '',
    price: '',
    unit: 'per kg',
    minRequirement: '4kgs per load'
  })
  const [creatingService, setCreatingService] = useState(false)

  // Shipping settings
  const [shippingSettings, setShippingSettings] = useState({
    shippingFee: 50,
    freeShippingThreshold: 4
  })
  const [editingShipping, setEditingShipping] = useState(false)
  const [tempShippingFee, setTempShippingFee] = useState('')
  const [tempThreshold, setTempThreshold] = useState('')
  const [updatingShipping, setUpdatingShipping] = useState(false)

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
      fetchShippingSettings()
    }
  }, [user])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await serviceAPI.getAllServices()
      setServices(response.data.filter(s => s.category !== 'FREE'))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch services')
      console.error('Error fetching services:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchShippingSettings = async () => {
    try {
      const response = await settingsAPI.getShippingSettings()
      setShippingSettings(response.data)
    } catch (err) {
      console.error('Error fetching shipping settings:', err)
    }
  }

  const handleEditShipping = () => {
    setTempShippingFee(shippingSettings.shippingFee)
    setTempThreshold(shippingSettings.freeShippingThreshold)
    setEditingShipping(true)
  }

  const handleSaveShipping = async () => {
    try {
      setUpdatingShipping(true)
      await settingsAPI.updateSetting('shippingFee', parseFloat(tempShippingFee))
      await settingsAPI.updateSetting('freeShippingThreshold', parseFloat(tempThreshold))
      await fetchShippingSettings()
      setEditingShipping(false)
      toast.success('Shipping settings updated successfully!')
    } catch (err) {
      console.error('Error updating shipping settings:', err)
      toast.error('Failed to update shipping settings')
    } finally {
      setUpdatingShipping(false)
    }
  }

  const handleCancelShippingEdit = () => {
    setEditingShipping(false)
    setTempShippingFee('')
    setTempThreshold('')
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
        toast.error('Please enter a valid price')
        return
      }

      await serviceAPI.updateServicePrice(serviceId, priceValue)
      setEditingService(null)
      setNewPrice('')
      fetchServices()
      toast.success('Price updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update price')
    }
  }

  const handleToggleStatus = async (serviceId) => {
    try {
      await serviceAPI.toggleServiceStatus(serviceId)
      fetchServices()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle service status')
    }
  }

  const handleCreateService = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!createFormData.name.trim() || !createFormData.description.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    const price = createFormData.unit === 'FREE' ? 0 : parseFloat(createFormData.price)
    if (createFormData.unit !== 'FREE' && (isNaN(price) || price < 0)) {
      toast.error('Please enter a valid price')
      return
    }

    try {
      setCreatingService(true)
      const serviceData = {
        ...createFormData,
        price: createFormData.unit === 'FREE' ? 0 : parseFloat(createFormData.price)
      }
      await serviceAPI.createService(serviceData)
      setShowCreateForm(false)
      setCreateFormData({
        name: '',
        category: 'Full Package',
        description: '',
        price: '',
        unit: 'per kg',
        minRequirement: '4kgs per load'
      })
      fetchServices()
      toast.success('Service created successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create service')
    } finally {
      setCreatingService(false)
    }
  }

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      try {
        await serviceAPI.deleteService(serviceId)
        fetchServices()
        toast.success('Service deleted successfully!')
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete service')
      }
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

      <div className="lg:ml-64 pt-20 md:pt-32 mt-4 md:mt-12 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
    
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-2">
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
              <span className="font-semibold">Note:</span> You can create new services, modify prices, and activate/deactivate services.
            </div>
          </div>

          {showCreateForm && (
            <div className="card bg-base-100 shadow-xl mb-6 border-2 border-primary">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="card-title text-lg">Create New Service</h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="btn btn-ghost btn-sm"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateService} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label h-14 px-0">
                        <span className="label-text">Service Name *</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Express Wash"
                        className="input input-bordered"
                        value={createFormData.name}
                        onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label h-14 px-0">
                        <span className="label-text">Category *</span>
                      </label>
                      <select
                        className="select select-bordered"
                        value={createFormData.category}
                        onChange={(e) => setCreateFormData({...createFormData, category: e.target.value})}
                      >
                        <option value="Full Package">Full Package</option>
                        <option value="Dry Service">Dry Service</option>
                        <option value="Delivery">Delivery</option>
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label h-14 px-0">
                        <span className="label-text">Unit *</span>
                      </label>
                      <select
                        className="select select-bordered"
                        value={createFormData.unit}
                        onChange={(e) => setCreateFormData({...createFormData, unit: e.target.value})}
                      >
                        <option value="per kg">per kg</option>
                        <option value="per load">per load</option>
                        <option value="FREE">FREE</option>
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label h-14 px-0">
                        <span className="label-text">Price {createFormData.unit === 'FREE' ? '(N/A)' : '*'}</span>
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        className="input input-bordered"
                        value={createFormData.price}
                        onChange={(e) => setCreateFormData({...createFormData, price: e.target.value})}
                        disabled={createFormData.unit === 'FREE'}
                        min="0"
                        required={createFormData.unit !== 'FREE'}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label h-14 px-0">
                        <span className="label-text">Description *</span>
                      </label>
                      <textarea
                        placeholder="e.g., Full service: Wash, Dry & Fold"
                        className="textarea textarea-bordered"
                        value={createFormData.description}
                        onChange={(e) => setCreateFormData({...createFormData, description: e.target.value})}
                        rows="2"
                        required
                      ></textarea>
                    </div>

                    <div className="form-control">
                      <label className="label h-14 px-0">
                        <span className="label-text">Minimum Requirement</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 4kgs per load"
                        className="input input-bordered"
                        value={createFormData.minRequirement}
                        onChange={(e) => setCreateFormData({...createFormData, minRequirement: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingService}
                      className="btn btn-primary"
                    >
                      {creatingService ? <span className="loading loading-spinner"></span> : <Plus className="h-4 w-4" />}
                      Create Service
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}<div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="card-title text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping & Delivery Settings
                </h3>
                {!editingShipping && (
                  <button onClick={handleEditShipping} className="btn btn-sm btn-outline gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                )}
              </div>

              {editingShipping ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Shipping Fee (PHP)</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={tempShippingFee}
                      onChange={(e) => setTempShippingFee(e.target.value)}
                      min="0"
                      step="1"
                    />
                    <label className="label">
                      <span className="label-text-alt">Applied when weight is below threshold</span>
                    </label>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Free Shipping Threshold (kg)</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={tempThreshold}
                      onChange={(e) => setTempThreshold(e.target.value)}
                      min="0"
                      step="0.1"
                    />
                    <label className="label">
                      <span className="label-text-alt">Minimum weight for free shipping</span>
                    </label>
                  </div>
                  <div className="col-span-full flex gap-2 justify-end">
                    <button
                      onClick={handleCancelShippingEdit}
                      className="btn btn-ghost"
                      disabled={updatingShipping}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveShipping}
                      className="btn btn-primary gap-2"
                      disabled={updatingShipping}
                    >
                      {updatingShipping ? <span className="loading loading-spinner"></span> : <Save className="h-4 w-4" />}
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2 p-4 bg-base-200 rounded-lg">
                    <div className="text-sm text-base-content/60">Shipping Fee</div>
                    <div className="text-2xl font-bold text-primary">₱{shippingSettings.shippingFee}</div>
                    <div className="text-xs text-base-content/60">Applied when weight {'<'} {shippingSettings.freeShippingThreshold}kg</div>
                  </div>
                  <div className="flex flex-col gap-2 p-4 bg-base-200 rounded-lg">
                    <div className="text-sm text-base-content/60">Free Shipping Threshold</div>
                    <div className="text-2xl font-bold text-success">{shippingSettings.freeShippingThreshold} kg</div>
                    <div className="text-xs text-base-content/60">Orders ≥ this weight get free shipping</div>
                  </div>
                </div>
              )}

              <div className="alert alert-info mt-4">
                <AlertCircle className="h-5 w-5" />
                <div className="text-sm">
                  <strong>Note:</strong> These settings apply to all new orders. Walk-in orders and online orders will automatically calculate shipping based on total weight.
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h3 className="card-title text-lg">General Service Information</h3>
              <div className="grid md:grid-cols-2 gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="badge badge-outline">Default Minimum</div>
                  <span className="text-sm">4kgs per load for most services</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="badge badge-outline">Current Shipping</div>
                  <span className="text-sm">₱{shippingSettings.shippingFee} fee, FREE for ≥{shippingSettings.freeShippingThreshold}kg</span>
                </div>
              </div>
            </div>
          </div>

          {!showCreateForm && (
            <div className="mb-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Service
              </button>
            </div>
          )}

          <div className="card bg-base-100 shadow-xl">
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
                                  <div className="tooltip" data-tip="Delete Service">
                                    <button
                                      className="btn btn-sm btn-ghost text-error"
                                      onClick={() => handleDeleteService(service._id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
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
