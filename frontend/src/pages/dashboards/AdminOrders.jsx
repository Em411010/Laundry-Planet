import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AdminSidebar, AdminNavbar } from '../../components/navbars/AdminNavbar'
import { orderAPI } from '../../services/api'
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  MapPin, 
  Phone,
  Calendar,
  Loader,
  MessageSquare,
  AlertCircle,
  Eye,
  ChevronDown,
  Camera
} from 'lucide-react'

const AdminOrders = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [filterType, setFilterType] = useState('all') // all, pending, completed
  const [allOrders, setAllOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showReviveModal, setShowReviveModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [reviveStatus, setReviveStatus] = useState('pending')
  const [actionLoading, setActionLoading] = useState(false)

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

  // Handle URL query parameters for filter navigation
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const type = searchParams.get('type')
    if (type && ['all', 'pending', 'completed'].includes(type)) {
      setFilterType(type)
    }
  }, [location.search])

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await orderAPI.getAllOrders({ limit: 1000 })
      setAllOrders(response.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredOrders = () => {
    if (filterType === 'pending') {
      return allOrders.filter(o => o.status === 'pending')
    } else if (filterType === 'completed') {
      return allOrders.filter(o => o.status === 'completed')
    } else if (filterType === 'cancelled') {
      return allOrders.filter(o => o.status === 'cancelled')
    }
    return allOrders
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
  }

  const handleCancelOrder = async () => {
    if (!selectedOrder) return
    
    try {
      setActionLoading(true)
      await orderAPI.cancelOrder(selectedOrder._id, cancelReason)
      
      // Refresh orders
      await fetchOrders()
      
      // Close modals and reset
      setShowCancelModal(false)
      setShowDetailModal(false)
      setCancelReason('')
      setSelectedOrder(null)
      
      // Show success message
      alert('Order cancelled successfully')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReviveOrder = async () => {
    if (!selectedOrder) return
    
    try {
      setActionLoading(true)
      await orderAPI.reviveOrder(selectedOrder._id, reviveStatus)
      
      // Refresh orders
      await fetchOrders()
      
      // Close modals and reset
      setShowReviveModal(false)
      setShowDetailModal(false)
      setReviveStatus('pending')
      setSelectedOrder(null)
      
      // Show success message
      alert('Order revived successfully')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revive order')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'badge-warning'
      case 'completed':
        return 'badge-success'
      case 'cancelled':
        return 'badge-error'
      case 'in-progress':
        return 'badge-info'
      default:
        return 'badge-ghost'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={18} className="text-warning" />
      case 'completed':
        return <CheckCircle size={18} className="text-success" />
      case 'cancelled':
        return <XCircle size={18} className="text-error" />
      case 'in-progress':
        return <Package size={18} className="text-info" />
      default:
        return <Package size={18} />
    }
  }

  if (!user) return null

  const filteredOrders = getFilteredOrders()

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <AdminSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <AdminNavbar toggleSidebar={toggleSidebar} />

      <div className="lg:ml-64 pt-32 mt-12 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Package className="text-primary" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Orders Management</h1>
                <p className="text-base-content/60">View and manage all customer orders</p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterType('all')}
                className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              >
                All Orders ({allOrders.length})
              </button>
              <button
                onClick={() => setFilterType('pending')}
                className={`btn ${filterType === 'pending' ? 'btn-warning' : 'btn-ghost'}`}
              >
                Pending ({allOrders.filter(o => o.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilterType('completed')}
                className={`btn ${filterType === 'completed' ? 'btn-success' : 'btn-ghost'}`}
              >
                Completed ({allOrders.filter(o => o.status === 'completed').length})
              </button>
              <button
                onClick={() => setFilterType('cancelled')}
                className={`btn ${filterType === 'cancelled' ? 'btn-error' : 'btn-ghost'}`}
              >
                Cancelled ({allOrders.filter(o => o.status === 'cancelled').length})
              </button>
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
                <p className="text-base-content/60">Loading orders...</p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto mb-3 text-base-content/40" size={40} />
              <p className="text-base-content/60">No {filterType !== 'all' ? filterType : ''} orders found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order._id} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
                  <div className="card-body p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(order.status)}
                          <h3 className="font-semibold text-lg">Order #{order._id.slice(-8)}</h3>
                          <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-base-content/60">
                          {new Date(order.createdAt).toLocaleDateString()} at{' '}
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                        className="btn btn-ghost btn-sm"
                      >
                        <ChevronDown size={18} className={`transition-transform ${expandedOrder === order._id ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4 py-4 border-y border-base-300">
                      <div className="flex items-center gap-2">
                        <User size={18} className="text-primary" />
                        <div>
                          <p className="text-xs text-base-content/60">Customer</p>
                          <p className="font-semibold text-sm">
                            {order.customer?.firstName} {order.customer?.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={18} className="text-primary" />
                        <div>
                          <p className="text-xs text-base-content/60">Phone</p>
                          <p className="font-semibold text-sm">{order.contactPhone || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={18} className="text-primary" />
                        <div>
                          <p className="text-xs text-base-content/60">Pickup Address</p>
                          <p className="font-semibold text-sm">
                            {typeof order.pickupAddress === 'object'
                              ? order.pickupAddress.fullAddress || `${order.pickupAddress.street}, ${order.pickupAddress.city}`
                              : order.pickupAddress || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-base-content/60 mb-2">Order Summary</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Total Amount:</span>
                            <span className="font-semibold text-primary">₱{order.totalAmount || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Payment Status:</span>
                            <span className={`badge ${order.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                              {order.paymentStatus || 'pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-base-content/60 mb-2">Assigned Staff</p>
                        <div className="text-sm space-y-2">
                          {order.assignedStaff?.pickup ? (
                            <div className="flex items-center gap-2 p-2 bg-base-200 rounded">
                              <div className="avatar placeholder">
                                <div className="bg-primary text-primary-content rounded-full w-6 h-6">
                                  <span className="text-xs">{order.assignedStaff.pickup.firstName?.[0]}{order.assignedStaff.pickup.lastName?.[0]}</span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-semibold">Pickup</p>
                                <p className="text-xs">{order.assignedStaff.pickup.firstName} {order.assignedStaff.pickup.lastName}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-base-content/60 p-2 bg-base-200 rounded">Pickup: Not assigned</p>
                          )}
                          {order.assignedStaff?.processing ? (
                            <div className="flex items-center gap-2 p-2 bg-base-200 rounded">
                              <div className="avatar placeholder">
                                <div className="bg-info text-info-content rounded-full w-6 h-6">
                                  <span className="text-xs">{order.assignedStaff.processing.firstName?.[0]}{order.assignedStaff.processing.lastName?.[0]}</span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-semibold">Processing</p>
                                <p className="text-xs">{order.assignedStaff.processing.firstName} {order.assignedStaff.processing.lastName}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-base-content/60 p-2 bg-base-200 rounded">Processing: Not assigned</p>
                          )}
                          {order.assignedStaff?.delivery ? (
                            <div className="flex items-center gap-2 p-2 bg-base-200 rounded">
                              <div className="avatar placeholder">
                                <div className="bg-success text-success-content rounded-full w-6 h-6">
                                  <span className="text-xs">{order.assignedStaff.delivery.firstName?.[0]}{order.assignedStaff.delivery.lastName?.[0]}</span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-semibold">Delivery</p>
                                <p className="text-xs">{order.assignedStaff.delivery.firstName} {order.assignedStaff.delivery.lastName}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-base-content/60 p-2 bg-base-200 rounded">Delivery: Not assigned</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedOrder === order._id && (
                      <div className="pt-4 border-t border-base-300 space-y-4">
                        <div>
                          <p className="text-sm font-semibold mb-2">Services Ordered</p>
                          {order.services && order.services.length > 0 ? (
                            <div className="space-y-1 text-sm">
                              {order.services.map((item, idx) => (
                                <div key={idx} className="flex justify-between bg-base-200 p-2 rounded">
                                  <div className="flex-1">
                                    <p>{item.service?.name || 'Unknown Service'}</p>
                                    <p className="text-xs text-base-content/60">Qty: {item.quantity} x ₱{item.price}</p>
                                  </div>
                                  <span className="font-semibold">₱{item.subtotal || item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-base-content/60 text-sm">No services</p>
                          )}
                        </div>

                        <div className="flex gap-2 flex-wrap pt-4">
                          <button
                            onClick={() => handleViewDetails(order)}
                            className="btn btn-primary btn-sm gap-2"
                          >
                            <Eye size={16} />
                            View Full Details
                          </button>
                          <button
                            onClick={() => navigate(`/dashboard/admin/support?orderId=${order._id}`)}
                            className="btn btn-info btn-sm gap-2"
                          >
                            <MessageSquare size={16} />
                            View Staff-Client Chat
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-base-100 rounded-lg shadow-2xl w-full max-w-5xl my-8">
            <div className="sticky top-0 bg-base-100 border-b border-base-300 p-6 flex items-center justify-between rounded-t-lg">
              <div>
                <h3 className="font-bold text-2xl mb-1">Order Details - {selectedOrder.orderNumber || `#${selectedOrder._id.slice(-8)}`}</h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedOrder.status)}
                  <span className={`badge ${getStatusBadgeClass(selectedOrder.status)}`}>
                    {selectedOrder.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h4 className="font-bold flex items-center gap-2">
                      <User size={20} />
                      Customer Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">Name:</span> {selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}</p>
                      <p><span className="font-semibold">Email:</span> {selectedOrder.customer?.email}</p>
                      <p><span className="font-semibold">Phone:</span> {selectedOrder.contactPhone}</p>
                      <p><span className="font-semibold">Member Since:</span> {new Date(selectedOrder.customer?.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-200">
                  <div className="card-body">
                    <h4 className="font-bold flex items-center gap-2">
                      <Calendar size={20} />
                      Pickup & Delivery Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">Pickup Date:</span> {new Date(selectedOrder.pickupDate).toLocaleDateString()}</p>
                      <p><span className="font-semibold">Pickup Time:</span> {selectedOrder.pickupTime}</p>
                      {selectedOrder.deliverDate && (
                        <p><span className="font-semibold text-accent">Delivery Date:</span> {new Date(selectedOrder.deliverDate).toLocaleDateString()}</p>
                      )}
                      {selectedOrder.deliverTime && (
                        <p><span className="font-semibold text-accent">Delivery Time:</span> {selectedOrder.deliverTime}</p>
                      )}
                      <p><span className="font-semibold">Payment Method:</span> {selectedOrder.paymentMethod}</p>
                      <p>
                        <span className="font-semibold">Payment Status:</span>{' '}
                        <span className={`badge ${selectedOrder.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                          {selectedOrder.paymentStatus || 'pending'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-200 lg:col-span-2">
                  <div className="card-body">
                    <h4 className="font-bold flex items-center gap-2">
                      <MapPin size={20} />
                      Pickup Address
                    </h4>
                    <p className="text-sm font-semibold mb-1">{selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}</p>
                    {typeof selectedOrder.pickupAddress === 'object' ? (
                      <>
                        <p className="text-sm mb-3">{selectedOrder.pickupAddress.fullAddress}</p>
                        {selectedOrder.pickupAddress.location?.coordinates && 
                         selectedOrder.pickupAddress.location.coordinates[0] !== 0 && (
                          <div className="mt-2 space-y-2">
                            <iframe
                              width="100%"
                              height="200"
                              style={{border: 0, borderRadius: '0.5rem'}}
                              loading="lazy"
                              allowFullScreen
                              referrerPolicy="no-referrer-when-downgrade"
                              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${selectedOrder.pickupAddress.location.coordinates[1]},${selectedOrder.pickupAddress.location.coordinates[0]}&zoom=15`}
                            ></iframe>
                            <a
                              href={`https://www.google.com/maps?q=${selectedOrder.pickupAddress.location.coordinates[1]},${selectedOrder.pickupAddress.location.coordinates[0]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline gap-2 w-full"
                            >
                              <MapPin size={16} />
                              Open in Google Maps
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm">{selectedOrder.pickupAddress || 'N/A'}</p>
                    )}
                  </div>
                </div>

                <div className="card bg-base-200 lg:col-span-2">
                  <div className="card-body">
                    <h4 className="font-bold flex items-center gap-2">
                      <Package size={20} />
                      Services
                    </h4>
                    <div className="space-y-2">
                      {selectedOrder.services && selectedOrder.services.length > 0 ? (
                        <>
                          {selectedOrder.services.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm bg-base-100 p-3 rounded">
                              <div className="flex flex-col">
                                <span className="font-medium">{item.service?.name || 'Unknown Service'}</span>
                                <span className="text-xs text-base-content/60">₱{item.price} per unit</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span>{item.quantity} units</span>
                                <span className="font-semibold">₱{item.subtotal || item.price * item.quantity}</span>
                              </div>
                            </div>
                          ))}
                          <div className="divider my-2"></div>
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span className="text-primary">₱{selectedOrder.totalAmount}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-base-content/60">No services</p>
                      )}
                    </div>
                  </div>
                </div>

                {(selectedOrder.assignedStaff?.pickup || selectedOrder.assignedStaff?.processing || selectedOrder.assignedStaff?.delivery) && (
                  <div className="card bg-base-200 lg:col-span-2">
                    <div className="card-body">
                      <h4 className="font-bold flex items-center gap-2">
                        <User size={20} />
                        Assigned Staff
                      </h4>
                      <div className="space-y-2 text-sm">
                        {selectedOrder.assignedStaff?.pickup && (
                          <p>
                            <span className="font-semibold">Pickup:</span>{' '}
                            {selectedOrder.assignedStaff.pickup.firstName} {selectedOrder.assignedStaff.pickup.lastName}
                            <span className="text-xs text-base-content/60 ml-2">({selectedOrder.assignedStaff.pickup.email})</span>
                          </p>
                        )}
                        {selectedOrder.assignedStaff?.processing && (
                          <p>
                            <span className="font-semibold">Processing:</span>{' '}
                            {selectedOrder.assignedStaff.processing.firstName} {selectedOrder.assignedStaff.processing.lastName}
                            <span className="text-xs text-base-content/60 ml-2">({selectedOrder.assignedStaff.processing.email})</span>
                          </p>
                        )}
                        {selectedOrder.assignedStaff?.delivery && (
                          <p>
                            <span className="font-semibold">Delivery:</span>{' '}
                            {selectedOrder.assignedStaff.delivery.firstName} {selectedOrder.assignedStaff.delivery.lastName}
                            <span className="text-xs text-base-content/60 ml-2">({selectedOrder.assignedStaff.delivery.email})</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                  <div className="card bg-base-200 lg:col-span-2">
                    <div className="card-body">
                      <h4 className="font-bold flex items-center gap-2 mb-3">
                        <Clock size={20} />
                        Status History
                      </h4>
                      <div className="space-y-3">
                        {selectedOrder.statusHistory.map((history, idx) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <div className="flex-shrink-0 mt-1">
                              {getStatusIcon(history.status)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`badge ${getStatusBadgeClass(history.status)} badge-sm`}>
                                  {history.status.toUpperCase()}
                                </span>
                                {(history.updatedByName || history.changedBy) && (
                                  <span className="text-xs text-base-content/60">
                                    by {history.updatedByName || (history.changedBy && `${history.changedBy.firstName} ${history.changedBy.lastName}`)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-base-content/70">
                                {new Date(history.updatedAt || history.timestamp).toLocaleDateString()} at{' '}
                                {new Date(history.updatedAt || history.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedOrder.images && selectedOrder.images.length > 0 && (
                  <div className="card bg-base-200 lg:col-span-2">
                    <div className="card-body">
                      <h4 className="font-bold flex items-center gap-2 mb-3">
                        <Camera size={20} />
                        Order Images
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedOrder.images.map((img, idx) => (
                          <div key={idx} className="relative">
                            <img 
                              src={img.url} 
                              alt={img.description || 'Order image'} 
                              className="w-full h-40 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(img.url, '_blank')}
                            />
                            {img.description && (
                              <p className="text-xs mt-1 text-base-content/70">{img.description}</p>
                            )}
                            <p className="text-xs text-base-content/50">
                              {new Date(img.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-base-300 p-6 flex gap-2 bg-base-100 rounded-b-lg">
              <button
                onClick={() => navigate(`/dashboard/admin/support?orderId=${selectedOrder._id}`)}
                className="btn btn-info gap-2"
              >
                <MessageSquare size={18} />
                View Chat
              </button>
              {selectedOrder.status === 'cancelled' ? (
                <button
                  onClick={() => setShowReviveModal(true)}
                  className="btn btn-success gap-2"
                >
                  <CheckCircle size={18} />
                  Revive Order
                </button>
              ) : (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="btn btn-error gap-2"
                  disabled={selectedOrder.status === 'completed'}
                >
                  <XCircle size={18} />
                  Cancel Order
                </button>
              )}
              <button onClick={() => setShowDetailModal(false)} className="btn flex-1">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-base-300">
              <h3 className="font-bold text-xl flex items-center gap-2 text-error">
                <XCircle size={24} />
                Cancel Order
              </h3>
            </div>
            <div className="p-6">
              <div className="alert alert-warning mb-4">
                <AlertCircle className="h-5 w-5" />
                <span>Are you sure you want to cancel this order?</span>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Cancellation Reason (Optional)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder="Enter reason for cancellation..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </div>
            <div className="p-6 border-t border-base-300 flex gap-2">
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelReason('')
                }}
                className="btn flex-1"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleCancelOrder}
                className="btn btn-error flex-1 gap-2"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle size={18} />
                    Confirm Cancel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revive Order Modal */}
      {showReviveModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-base-300">
              <h3 className="font-bold text-xl flex items-center gap-2 text-success">
                <CheckCircle size={24} />
                Revive Order
              </h3>
            </div>
            <div className="p-6">
              <div className="alert alert-info mb-4">
                <AlertCircle className="h-5 w-5" />
                <span>This will restore the cancelled order.</span>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Set New Status</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={reviveStatus}
                  onChange={(e) => setReviveStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="picked-up">Picked Up</option>
                  <option value="in-progress">In Progress</option>
                  <option value="ready-for-delivery">Ready for Delivery</option>
                </select>
                <label className="label">
                  <span className="label-text-alt">Choose the status to restore the order to</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-base-300 flex gap-2">
              <button
                onClick={() => {
                  setShowReviveModal(false)
                  setReviveStatus('pending')
                }}
                className="btn flex-1"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleReviveOrder}
                className="btn btn-success flex-1 gap-2"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Reviving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Confirm Revive
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrders
