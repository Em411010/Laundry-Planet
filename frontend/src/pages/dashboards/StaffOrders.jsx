import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StaffSidebar, StaffNavbar } from '../../components/navbars/StaffNavbar'
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
  Truck,
  Weight,
  Camera,
  MessageSquare,
  AlertCircle,
  Eye,
  Check
} from 'lucide-react'

const StaffOrders = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  const [activeTab, setActiveTab] = useState('all') // all, pending, completed
  const [allOrders, setAllOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Order update form
  const [updatingOrder, setUpdatingOrder] = useState(false)
  const [weightForm, setWeightForm] = useState({ weight: '', services: [] })
  const [imageUrl, setImageUrl] = useState('')
  const [imageDescription, setImageDescription] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== 'staff') {
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
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const allOrdersRes = await orderAPI.getAllOrders()
      
      setAllOrders(allOrdersRes.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptOrder = async (orderId) => {
    try {
      console.log('Accepting order with ID:', orderId)
      setUpdatingOrder(true)
      const result = await orderAPI.acceptOrder(orderId)
      console.log('Accept order result:', result)
      setSuccess('Order accepted successfully!')
      setTimeout(() => setSuccess(null), 3000)
      fetchOrders()
    } catch (err) {
      console.error('Accept order error:', err)
      setError(err.response?.data?.message || 'Failed to accept order')
      setTimeout(() => setError(null), 3000)
    } finally {
      setUpdatingOrder(false)
    }
  }

  const handleUpdateWeight = async (orderId) => {
    try {
      if (!weightForm.weight || weightForm.weight <= 0) {
        setError('Please enter a valid weight')
        setTimeout(() => setError(null), 3000)
        return
      }

      setUpdatingOrder(true)
      await orderAPI.updateOrderWeight(orderId, parseFloat(weightForm.weight), weightForm.services)
      setSuccess('Weight updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
      setWeightForm({ weight: '', services: [] })
      fetchOrders()
      if (selectedOrder) {
        const updated = await orderAPI.getOrderById(orderId)
        setSelectedOrder(updated.data)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update weight')
      setTimeout(() => setError(null), 3000)
    } finally {
      setUpdatingOrder(false)
    }
  }

  const handleAddImage = async (orderId) => {
    try {
      if (!imageUrl.trim()) {
        setError('Please enter an image URL')
        setTimeout(() => setError(null), 3000)
        return
      }

      setUpdatingOrder(true)
      await orderAPI.addOrderImage(orderId, imageUrl, imageDescription)
      setSuccess('Image added successfully!')
      setTimeout(() => setSuccess(null), 3000)
      setImageUrl('')
      setImageDescription('')
      fetchOrders()
      if (selectedOrder) {
        const updated = await orderAPI.getOrderById(orderId)
        setSelectedOrder(updated.data)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add image')
      setTimeout(() => setError(null), 3000)
    } finally {
      setUpdatingOrder(false)
    }
  }

  const handleSendMessage = async (orderId) => {
    try {
      if (!newMessage.trim()) {
        return
      }

      setUpdatingOrder(true)
      await orderAPI.addOrderMessage(orderId, newMessage)
      setSuccess('Message sent!')
      setTimeout(() => setSuccess(null), 2000)
      setNewMessage('')
      fetchOrders()
      if (selectedOrder) {
        const updated = await orderAPI.getOrderById(orderId)
        setSelectedOrder(updated.data)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message')
      setTimeout(() => setError(null), 3000)
    } finally {
      setUpdatingOrder(false)
    }
  }

  const handleUpdateStatus = async (orderId, status) => {
    try {
      setUpdatingOrder(true)
      await orderAPI.updateOrderStatus(orderId, status)
      setSuccess(`Status updated to ${status}!`)
      setTimeout(() => setSuccess(null), 3000)
      fetchOrders()
      if (selectedOrder) {
        const updated = await orderAPI.getOrderById(orderId)
        setSelectedOrder(updated.data)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status')
      setTimeout(() => setError(null), 3000)
    } finally {
      setUpdatingOrder(false)
    }
  }

  const openOrderDetail = async (order) => {
    try {
      const response = await orderAPI.getOrderById(order._id)
      setSelectedOrder(response.data)
      setShowDetailModal(true)
      setNewStatus(response.data.status)
      setWeightForm({
        weight: response.data.actualWeight || '',
        services: response.data.services.map(s => ({
          serviceId: s.service._id,
          quantity: s.quantity
        }))
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order details')
      setTimeout(() => setError(null), 3000)
    }
  }

  const getStatusDisplay = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'accepted': 'To Be Pickup',
      'picked-up': 'Picked Up - On the Store',
      'in-progress': 'On Going Services',
      'processed': 'Services Done',
      'for-delivery': 'To Be Deliver',
      'delivered': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'badge-warning',
      'accepted': 'badge-info',
      'picked-up': 'badge-primary',
      'in-progress': 'badge-secondary',
      'processed': 'badge-accent',
      'for-delivery': 'badge-accent',
      'delivered': 'badge-success',
      'cancelled': 'badge-error'
    }
    return badges[status] || 'badge-ghost'
  }

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'pending': 'accepted',
      'accepted': 'picked-up',
      'picked-up': 'in-progress',
      'in-progress': 'processed',
      'processed': 'for-delivery',
      'for-delivery': 'delivered'
    }
    return statusFlow[currentStatus]
  }

  const filterOrders = () => {
    if (activeTab === 'waitingToAccept') {
      // Orders that can be accepted: pending, picked-up, or processed
      return allOrders.filter(o => 
        o.status === 'pending' || 
        o.status === 'picked-up' || 
        o.status === 'processed'
      )
    } else if (activeTab === 'pending') {
      // Orders that are in active processing (accepted, picked-up, in-progress, processed, for-delivery)
      return allOrders.filter(o => 
        o.status === 'accepted' || 
        o.status === 'picked-up' || 
        o.status === 'in-progress' || 
        o.status === 'processed' || 
        o.status === 'for-delivery'
      )
    } else if (activeTab === 'completed') {
      return allOrders.filter(o => o.status === 'delivered' || o.status === 'cancelled')
    }
    return allOrders
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  if (!user) return null

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <StaffSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <StaffNavbar toggleSidebar={toggleSidebar} />

      <div className="lg:ml-64 pt-20 p-4 md:p-8">
        <div className="max-w-7xl mx-auto"><div className="flex items-center gap-3 mb-6 mt-10">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Order Management</h1>
          </div>{success && (
            <div className="alert alert-success mb-6">
              <CheckCircle className="h-5 w-5" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error mb-6">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}<div className="tabs tabs-boxed mb-6 bg-base-100 p-2">
            <a 
              className={`tab ${activeTab === 'waitingToAccept' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('waitingToAccept')}
            >
              Waiting to Accept ({allOrders.filter(o => o.status === 'pending' || o.status === 'picked-up' || o.status === 'processed').length})
            </a>
            <a 
              className={`tab ${activeTab === 'all' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Orders ({allOrders.length})
            </a>
            <a 
              className={`tab ${activeTab === 'pending' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              In Progress ({allOrders.filter(o => o.status === 'accepted' || o.status === 'picked-up' || o.status === 'in-progress' || o.status === 'processed' || o.status === 'for-delivery').length})
            </a>
            <a 
              className={`tab ${activeTab === 'completed' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed ({allOrders.filter(o => o.status === 'delivered' || o.status === 'cancelled').length})
            </a>
          </div>{loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : filterOrders().length === 0 ? (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center py-12">
                <Package className="h-16 w-16 text-base-content/20 mb-4" />
                <h3 className="text-xl font-semibold">No orders found</h3>
                <p className="text-base-content/60">
                  {activeTab === 'waitingToAccept' && 'No orders waiting to be accepted'}
                  {activeTab === 'pending' && 'No orders in progress'}
                  {activeTab === 'completed' && 'No completed orders yet'}
                  {activeTab === 'all' && 'No orders available'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {filterOrders().map((order) => (
                <div key={order._id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="card-body">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{order.orderNumber}</h3>
                          <span className={`badge ${getStatusBadge(order.status)}`}>
                            {getStatusDisplay(order.status)}
                          </span>
                          {order.assignedStaff && (
                            <span className="badge badge-outline">
                              Assigned: {order.assignedStaff.firstName} {order.assignedStaff.lastName}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-2 text-sm">
                          <p className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {order.customer.firstName} {order.customer.lastName}
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {order.contactPhone}
                          </p>
                          <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Pickup: {new Date(order.pickupDate).toLocaleDateString()}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {order.pickupTime}
                          </p>
                          <p className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {order.services.length} service(s)
                          </p>
                          <p className="flex items-center gap-2 font-semibold text-primary">
                            ₱{order.totalAmount.toFixed(2)}
                          </p>
                        </div>

                        {order.actualWeight > 0 && (
                          <p className="flex items-center gap-2 text-sm mt-2">
                            <Weight className="h-4 w-4" />
                            Weight: {order.actualWeight} kg
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => openOrderDetail(order)}
                          className="btn btn-sm btn-outline gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                        
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleAcceptOrder(order._id)}
                            className="btn btn-sm btn-primary gap-2"
                            disabled={updatingOrder}
                          >
                            <Check className="h-4 w-4" />
                            Accept for Pickup
                          </button>
                        )}
                        
                        {order.status === 'picked-up' && (
                          <button
                            onClick={() => handleAcceptOrder(order._id)}
                            className="btn btn-sm btn-primary gap-2"
                            disabled={updatingOrder}
                          >
                            <Check className="h-4 w-4" />
                            Accept for Processing
                          </button>
                        )}
                        
                        {order.status === 'processed' && (
                          <button
                            onClick={() => handleAcceptOrder(order._id)}
                            className="btn btn-sm btn-primary gap-2"
                            disabled={updatingOrder}
                          >
                            <Check className="h-4 w-4" />
                            Accept for Delivery
                          </button>
                        )}

                        {order.assignedStaff?._id === user.id && getNextStatus(order.status) && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, getNextStatus(order.status))}
                            className="btn btn-sm btn-success gap-2"
                            disabled={updatingOrder}
                          >
                            Mark as {getNextStatus(order.status)}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>{showDetailModal && selectedOrder && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowDetailModal(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              ✕
            </button>

            <h3 className="font-bold text-2xl mb-4">Order Details - {selectedOrder.orderNumber}</h3>

            <div className="grid lg:grid-cols-2 gap-6"><div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="font-bold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Name:</span> {selectedOrder.customer.firstName} {selectedOrder.customer.lastName}</p>
                    <p><span className="font-semibold">Email:</span> {selectedOrder.customer.email}</p>
                    <p><span className="font-semibold">Phone:</span> {selectedOrder.contactPhone}</p>
                  </div>
                </div>
              </div><div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="font-bold flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Pickup Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Date:</span> {new Date(selectedOrder.pickupDate).toLocaleDateString()}</p>
                    <p><span className="font-semibold">Time:</span> {selectedOrder.pickupTime}</p>
                    <p><span className="font-semibold">Payment:</span> {selectedOrder.paymentMethod}</p>
                    <p><span className="font-semibold">Status:</span> <span className={`badge ${getStatusBadge(selectedOrder.status)}`}>{getStatusDisplay(selectedOrder.status)}</span></p>
                  </div>
                </div>
              </div><div className="card bg-base-200 lg:col-span-2">
                <div className="card-body">
                  <h4 className="font-bold flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Pickup Address
                  </h4>
                  <p className="text-sm">{selectedOrder.pickupAddress.fullAddress}</p>
                  {selectedOrder.pickupAddress.location?.coordinates[0] !== 0 && (
                    <div className="mt-2">
                      <a
                        href={`https://www.google.com/maps?q=${selectedOrder.pickupAddress.location.coordinates[1]},${selectedOrder.pickupAddress.location.coordinates[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        Open in Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </div><div className="card bg-base-200 lg:col-span-2">
                <div className="card-body">
                  <h4 className="font-bold flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Services
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.services.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-base-100 p-2 rounded">
                        <span>{s.service.name}</span>
                        <div className="flex items-center gap-4">
                          <span>{s.quantity} {s.service.unit}</span>
                          <span className="font-semibold">₱{s.subtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="divider my-2"></div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-primary">₱{selectedOrder.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>{selectedOrder.assignedStaff?._id === user.id && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                <div className="card bg-base-200 lg:col-span-2">
                  <div className="card-body">
                    <h4 className="font-bold flex items-center gap-2">
                      <Weight className="h-5 w-5" />
                      Update Weight
                    </h4>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Actual Weight (kg)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.1"
                          className="input input-bordered flex-1"
                          placeholder="Enter weight..."
                          value={weightForm.weight}
                          onChange={(e) => setWeightForm({...weightForm, weight: e.target.value})}
                        />
                        <button
                          onClick={() => handleUpdateWeight(selectedOrder._id)}
                          className="btn btn-primary"
                          disabled={updatingOrder}
                        >
                          Update
                        </button>
                      </div>
                      {selectedOrder.actualWeight > 0 && (
                        <p className="text-sm text-base-content/60 mt-2">
                          Current weight: {selectedOrder.actualWeight} kg
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}{selectedOrder.assignedStaff?._id === user.id && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                <div className="card bg-base-200 lg:col-span-2">
                  <div className="card-body">
                    <h4 className="font-bold flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Add Image
                    </h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Image URL..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Description (optional)..."
                        value={imageDescription}
                        onChange={(e) => setImageDescription(e.target.value)}
                      />
                      <button
                        onClick={() => handleAddImage(selectedOrder._id)}
                        className="btn btn-primary w-full"
                        disabled={updatingOrder}
                      >
                        Add Image
                      </button>
                    </div>{selectedOrder.images && selectedOrder.images.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-semibold mb-2">Uploaded Images</h5>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedOrder.images.map((img, idx) => (
                            <div key={idx} className="relative">
                              <img src={img.url} alt={img.description} className="w-full h-32 object-cover rounded" />
                              {img.description && (
                                <p className="text-xs mt-1">{img.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}<div className="card bg-base-200 lg:col-span-2">
                <div className="card-body">
                  <h4 className="font-bold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Messages
                  </h4><div className="space-y-2 max-h-60 overflow-y-auto mb-3">
                    {selectedOrder.messages && selectedOrder.messages.length > 0 ? (
                      selectedOrder.messages.map((msg, idx) => (
                        <div 
                          key={idx} 
                          className={`chat ${msg.sender._id === user.id ? 'chat-end' : 'chat-start'}`}
                        >
                          <div className="chat-header text-xs">
                            {msg.sender.firstName} {msg.sender.lastName}
                            <time className="text-xs opacity-50 ml-1">
                              {new Date(msg.timestamp).toLocaleString()}
                            </time>
                          </div>
                          <div className="chat-bubble">{msg.message}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-base-content/60">No messages yet</p>
                    )}
                  </div><div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(selectedOrder._id)}
                    />
                    <button
                      onClick={() => handleSendMessage(selectedOrder._id)}
                      className="btn btn-primary"
                      disabled={updatingOrder || !newMessage.trim()}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>{selectedOrder.assignedStaff?._id === user.id && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                <div className="card bg-base-200 lg:col-span-2">
                  <div className="card-body">
                    <h4 className="font-bold">Update Status</h4>
                    <select
                      className="select select-bordered w-full"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="picked-up">Picked Up</option>
                      <option value="washing">Washing</option>
                      <option value="drying">Drying</option>
                      <option value="folding">Folding</option>
                      <option value="ready">Ready</option>
                      <option value="out-for-delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                    </select>
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder._id, newStatus)}
                      className="btn btn-primary w-full mt-2"
                      disabled={updatingOrder || newStatus === selectedOrder.status}
                    >
                      Update Status
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button onClick={() => setShowDetailModal(false)} className="btn">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffOrders
