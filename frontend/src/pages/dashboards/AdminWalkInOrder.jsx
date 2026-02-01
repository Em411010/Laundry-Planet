import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminSidebar, AdminNavbar } from '../../components/navbars/AdminNavbar'
import { orderAPI, userAPI, serviceAPI } from '../../services/api'
import { 
  ShoppingCart, 
  User, 
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader,
  Package,
  Phone,
  Mail,
  UserPlus,
  DollarSign
} from 'lucide-react'

const AdminWalkInOrder = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Customer Management
  const [customerType, setCustomerType] = useState('existing') // existing, new, guest
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [searching, setSearching] = useState(false)
  
  // Guest Customer Form
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  })

  // Services
  const [availableServices, setAvailableServices] = useState([])
  const [cart, setCart] = useState([])

  // Order Details
  const [orderDetails, setOrderDetails] = useState({
    paymentMethod: 'cash',
    paymentStatus: 'paid', // Walk-in orders are typically paid immediately
    specialInstructions: '',
    pickupDate: new Date().toISOString().split('T')[0],
    pickupTime: 'Immediate',
    deliverDate: '',
    deliverTime: ''
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
      fetchServices()
    }
  }, [user])

  const fetchServices = async () => {
    try {
      const response = await serviceAPI.getAllServices()
      setAvailableServices(response.data.filter(s => s.isActive))
    } catch (err) {
      setError('Failed to load services')
    }
  }

  const searchCustomers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      const response = await userAPI.searchUsers(query)
      setSearchResults(response.data || [])
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSearchChange = (value) => {
    setSearchQuery(value)
    searchCustomers(value)
  }

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer)
    setSearchQuery(`${customer.firstName} ${customer.lastName} - ${customer.phone}`)
    setSearchResults([])
  }

  const clearCustomerSelection = () => {
    setSelectedCustomer(null)
    setSearchQuery('')
    setSearchResults([])
  }

  const addToCart = (service) => {
    const existingItem = cart.find(item => item.serviceId === service._id)
    if (existingItem) {
      setCart(cart.map(item => 
        item.serviceId === service._id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        serviceId: service._id,
        name: service.name,
        price: service.price,
        quantity: 1
      }])
    }
  }

  const updateQuantity = (serviceId, change) => {
    setCart(cart.map(item => {
      if (item.serviceId === serviceId) {
        const newQuantity = Math.max(1, item.quantity + change)
        return { ...item, quantity: newQuantity }
      }
      return item
    }))
  }

  const removeFromCart = (serviceId) => {
    setCart(cart.filter(item => item.serviceId !== serviceId))
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const validateOrder = () => {
    // Validate customer
    if (customerType === 'existing' && !selectedCustomer) {
      return 'Please select a customer'
    }
    if (customerType === 'guest') {
      if (!guestInfo.firstName || !guestInfo.lastName || !guestInfo.phone) {
        return 'Please fill in all required guest information'
      }
    }

    // Validate cart
    if (cart.length === 0) {
      return 'Please add at least one service to the order'
    }

    // Validate payment
    if (!orderDetails.paymentMethod) {
      return 'Please select a payment method'
    }

    return null
  }

  const handleSubmitOrder = async () => {
    const validationError = validateOrder()
    if (validationError) {
      setError(validationError)
      setTimeout(() => setError(null), 4000)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const orderData = {
        services: cart.map(item => ({
          serviceId: item.serviceId,
          quantity: item.quantity
        })),
        paymentMethod: orderDetails.paymentMethod,
        paymentStatus: orderDetails.paymentStatus,
        specialInstructions: orderDetails.specialInstructions,
        pickupDate: orderDetails.pickupDate,
        pickupTime: orderDetails.pickupTime,
        deliverDate: orderDetails.deliverDate || undefined,
        deliverTime: orderDetails.deliverTime || undefined
      }

      if (customerType === 'existing') {
        orderData.customerId = selectedCustomer._id
        orderData.contactPhone = selectedCustomer.phone
        orderData.isGuest = false
      } else {
        orderData.isGuest = true
        orderData.customerInfo = guestInfo
      }

      const response = await orderAPI.createWalkInOrder(orderData)
      
      setSuccess(`Order created successfully! Order #${response.data._id.slice(-8)}`)
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setCart([])
        setSelectedCustomer(null)
        setSearchQuery('')
        setGuestInfo({ firstName: '', lastName: '', phone: '', email: '' })
        setOrderDetails({
          paymentMethod: 'cash',
          paymentStatus: 'paid',
          specialInstructions: '',
          pickupDate: new Date().toISOString().split('T')[0],
          pickupTime: 'Immediate',
          deliverDate: '',
          deliverTime: ''
        })
        setSuccess(null)
      }, 3000)

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order')
      setTimeout(() => setError(null), 4000)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const totalAmount = calculateTotal()

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <AdminSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <AdminNavbar toggleSidebar={toggleSidebar} />

      <div className="lg:ml-64 pt-32 mt-12 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <ShoppingCart className="text-primary" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Walk-in Order</h1>
                <p className="text-base-content/60">Create orders for walk-in customers</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error mb-6">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-6">
              <CheckCircle className="h-5 w-5" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Customer & Services */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Selection */}
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2">
                    <User size={20} />
                    Customer Information
                  </h3>

                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setCustomerType('existing')}
                      className={`btn btn-sm ${customerType === 'existing' ? 'btn-primary' : 'btn-ghost'}`}
                    >
                      <Search size={16} />
                      Existing Member
                    </button>
                    <button
                      onClick={() => setCustomerType('guest')}
                      className={`btn btn-sm ${customerType === 'guest' ? 'btn-primary' : 'btn-ghost'}`}
                    >
                      <UserPlus size={16} />
                      Guest Customer
                    </button>
                  </div>

                  {customerType === 'existing' && (
                    <div>
                      {!selectedCustomer ? (
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Search by name or phone</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Enter customer name or phone..."
                              className="input input-bordered w-full"
                              value={searchQuery}
                              onChange={(e) => handleSearchChange(e.target.value)}
                            />
                            {searching && (
                              <Loader className="absolute right-3 top-3 animate-spin" size={20} />
                            )}
                          </div>
                          
                          {searchResults.length > 0 && (
                            <div className="mt-2 bg-base-200 rounded-lg max-h-60 overflow-y-auto">
                              {searchResults.map((customer) => (
                                <div
                                  key={customer._id}
                                  onClick={() => selectCustomer(customer)}
                                  className="p-3 hover:bg-base-300 cursor-pointer border-b border-base-300 last:border-b-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold">{customer.firstName} {customer.lastName}</p>
                                      <p className="text-sm text-base-content/60">{customer.phone}</p>
                                      <p className="text-xs text-base-content/50">{customer.email}</p>
                                    </div>
                                    <Plus size={20} className="text-primary" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-primary/10 p-4 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-lg">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                              <p className="text-sm flex items-center gap-2 mt-1">
                                <Phone size={14} /> {selectedCustomer.phone}
                              </p>
                              <p className="text-sm flex items-center gap-2 mt-1">
                                <Mail size={14} /> {selectedCustomer.email}
                              </p>
                            </div>
                            <button
                              onClick={clearCustomerSelection}
                              className="btn btn-ghost btn-sm btn-circle"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {customerType === 'guest' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">First Name *</span>
                          </label>
                          <input
                            type="text"
                            placeholder="First name"
                            className="input input-bordered"
                            value={guestInfo.firstName}
                            onChange={(e) => setGuestInfo({...guestInfo, firstName: e.target.value})}
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Last Name *</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Last name"
                            className="input input-bordered"
                            value={guestInfo.lastName}
                            onChange={(e) => setGuestInfo({...guestInfo, lastName: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Phone Number *</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="09XX XXX XXXX"
                          className="input input-bordered"
                          value={guestInfo.phone}
                          onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Email (Optional)</span>
                        </label>
                        <input
                          type="email"
                          placeholder="email@example.com"
                          className="input input-bordered"
                          value={guestInfo.email}
                          onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Services */}
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2">
                    <Package size={20} />
                    Available Services
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3 mt-4">
                    {availableServices.map((service) => (
                      <div
                        key={service._id}
                        className="p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{service.name}</h4>
                            <p className="text-xs text-base-content/60">{service.category}</p>
                            <p className="text-lg font-bold text-primary mt-1">₱{service.price}</p>
                          </div>
                          <button
                            onClick={() => addToCart(service)}
                            className="btn btn-primary btn-sm btn-circle"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        {service.description && (
                          <p className="text-xs text-base-content/60">{service.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Cart & Checkout */}
            <div className="space-y-6">
              {/* Shopping Cart */}
              <div className="card bg-base-100 shadow-md sticky top-36">
                <div className="card-body">
                  <h3 className="card-title flex items-center gap-2">
                    <ShoppingCart size={20} />
                    Order Summary
                  </h3>

                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="mx-auto mb-2 text-base-content/40" size={40} />
                      <p className="text-base-content/60 text-sm">No services added</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.serviceId} className="bg-base-200 p-3 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{item.name}</p>
                              <p className="text-xs text-base-content/60">₱{item.price} per unit</p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.serviceId)}
                              className="btn btn-ghost btn-xs btn-circle"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.serviceId, -1)}
                                className="btn btn-xs btn-circle"
                                disabled={item.quantity <= 1}
                              >
                                <Minus size={12} />
                              </button>
                              <span className="font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.serviceId, 1)}
                                className="btn btn-xs btn-circle"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <span className="font-bold">₱{item.price * item.quantity}</span>
                          </div>
                        </div>
                      ))}

                      <div className="divider my-2"></div>

                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-primary">₱{totalAmount}</span>
                      </div>
                    </div>
                  )}

                  {/* Payment Details */}
                  <div className="space-y-3 mt-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Payment Method</span>
                      </label>
                      <select
                        className="select select-bordered"
                        value={orderDetails.paymentMethod}
                        onChange={(e) => setOrderDetails({...orderDetails, paymentMethod: e.target.value})}
                      >
                        <option value="cash">Cash</option>
                        <option value="gcash">GCash</option>
                        <option value="card">Card</option>
                      </select>
                      {orderDetails.paymentMethod === 'gcash' && (
                        <p className="text-xs text-info mt-1">
                          For walk-in: Customer pays via store QR code or direct transfer
                        </p>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Payment Status</span>
                      </label>
                      <select
                        className="select select-bordered"
                        value={orderDetails.paymentStatus}
                        onChange={(e) => setOrderDetails({...orderDetails, paymentStatus: e.target.value})}
                      >
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Special Instructions</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-20"
                        placeholder="Any special requests..."
                        value={orderDetails.specialInstructions}
                        onChange={(e) => setOrderDetails({...orderDetails, specialInstructions: e.target.value})}
                      ></textarea>
                    </div>

                    <button
                      onClick={handleSubmitOrder}
                      disabled={loading || cart.length === 0}
                      className="btn btn-primary w-full gap-2"
                    >
                      {loading ? (
                        <Loader className="animate-spin" size={18} />
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          Create Order - ₱{totalAmount}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminWalkInOrder
