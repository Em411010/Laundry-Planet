import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { StaffSidebar, StaffNavbar } from '../components/navbars/StaffNavbar'
import { orderAPI, serviceAPI } from '../services/api'
import OrderChat from '../components/OrderChat'
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
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [activeTab, setActiveTab] = useState('myTasks') // myTasks, waitingToAccept, all, pending, completed
  const [allOrders, setAllOrders] = useState([])
  const [myTasks, setMyTasks] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Order update form
  const [updatingOrder, setUpdatingOrder] = useState(false)
  const [weightForm, setWeightForm] = useState({ weight: '', services: [] })
  const [imageUrl, setImageUrl] = useState('')
  const [imageDescription, setImageDescription] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [availableServices, setAvailableServices] = useState([])
  const [modifyingServices, setModifyingServices] = useState(false)

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

  // Handle URL query parameters for tab navigation
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const tab = searchParams.get('tab')
    if (tab && ['myTasks', 'waitingToAccept', 'all', 'pending', 'completed'].includes(tab)) {
      setActiveTab(tab)
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
      const [allOrdersRes, myTasksRes] = await Promise.all([
        orderAPI.getAllOrders({ limit: 1000 }), // Fetch up to 1000 orders to include completed ones
        orderAPI.getStaffTasks()
      ])
      
      setAllOrders(allOrdersRes.data)
      setMyTasks(myTasksRes.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load orders')
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
      toast.success('Order accepted successfully!')
      fetchOrders()
    } catch (err) {
      console.error('Accept order error:', err)
      toast.error(err.response?.data?.message || 'Failed to accept order')
    } finally {
      setUpdatingOrder(false)
    }
  }

  const handleUpdateWeight = async (orderId) => {
    try {
      // Validate all services have weights
      if (!weightForm.services || weightForm.services.length === 0) {
        toast.error('Please enter weights for all services')
        return
      }

      const allWeightsValid = weightForm.services.every(s => s.quantity > 0)
      if (!allWeightsValid) {
        toast.error('Please enter a valid weight for all services')
        return
      }

      // Calculate total weight
      const totalWeight = weightForm.services.reduce((sum, s) => sum + s.quantity, 0)

      setUpdatingOrder(true)
      await orderAPI.updateOrderWeight(orderId, {
        weight: totalWeight,
        services: weightForm.services
      })
      toast.success('Weights updated successfully!')
      setWeightForm({ weight: '', services: [] })
      fetchOrders()
      if (selectedOrder) {
        const updated = await orderAPI.getOrderById(orderId)
        setSelectedOrder(updated.data)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update weight')
    } finally {
      setUpdatingOrder(false)
    }
  }

  const handleAddImage = async (orderId) => {
    try {
      if (!imageUrl.trim()) {
        toast.error('Please enter an image URL')
        return
      }

      setUpdatingOrder(true)
      await orderAPI.addOrderImage(orderId, imageUrl, imageDescription)
      toast.success('Image added successfully!')
      setImageUrl('')
      setImageDescription('')
      fetchOrders()
      if (selectedOrder) {
        const updated = await orderAPI.getOrderById(orderId)
        setSelectedOrder(updated.data)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add image')
    } finally {
      setUpdatingOrder(false)
    }
  }

  const handleUpdateStatus = async (orderId, status) => {
    try {
      setUpdatingOrder(true)
      await orderAPI.updateOrderStatus(orderId, status)
      toast.success(`Status updated to ${status}!`)
      fetchOrders()
      if (selectedOrder) {
        const updated = await orderAPI.getOrderById(orderId)
        setSelectedOrder(updated.data)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdatingOrder(false)
    }
  }

  const handleAdvanceStatus = async () => {
    const nextStatus = getNextStatus(selectedOrder.status)
    
    if (!nextStatus) {
      toast.error('This order is already at the final stage')
      return
    }

    // Check weight requirement for accepted -> picked-up
    if (selectedOrder.status === 'accepted') {
      const allWeightsEntered = selectedOrder.services.every(s => s.quantity > 0)
      if (!allWeightsEntered) {
        toast.error('Please weigh all services before marking as picked up')
        return
      }
    }

    try {
      setUpdatingOrder(true)
      await orderAPI.updateOrderStatus(selectedOrder._id, nextStatus)
      toast.success(`Order advanced to ${getStatusDisplay(nextStatus)}!`)
      fetchOrders()
      setShowDetailModal(false)
      setSelectedOrder(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to advance order status')
    } finally {
      setUpdatingOrder(false)
    }
  }

  const handleMarkPaymentReceived = async () => {
    try {
      setUpdatingOrder(true)
      await orderAPI.markPaymentReceived(selectedOrder._id)
      toast.success('Payment confirmed successfully!')
      
      // Refresh order details
      const updated = await orderAPI.getOrderById(selectedOrder._id)
      setSelectedOrder(updated.data)
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm payment')
    } finally {
      setUpdatingOrder(false)
    }
  }

  const handleModifyServices = async (services) => {
    try {
      setModifyingServices(true)
      await orderAPI.modifyOrderServices(selectedOrder._id, services)
      toast.success('Services updated successfully!')
      
      // Refresh order details
      const updated = await orderAPI.getOrderById(selectedOrder._id)
      setSelectedOrder(updated.data)
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to modify services')
    } finally {
      setModifyingServices(false)
    }
  }

  const handleAddService = () => {
    if (!selectedOrder) return
    // Add a new empty service entry with proper structure
    const newServices = [...selectedOrder.services, { 
      service: { _id: '', name: 'Select Service', price: 0, unit: 'kg' }, 
      quantity: 1,
      price: 0,
      subtotal: 0
    }]
    setSelectedOrder({ ...selectedOrder, services: newServices })
  }

  const handleRemoveService = (index) => {
    if (!selectedOrder) return
    const newServices = selectedOrder.services.filter((_, idx) => idx !== index)
    setSelectedOrder({ ...selectedOrder, services: newServices })
  }

  const handleServiceChange = (index, field, value) => {
    if (!selectedOrder) return
    const newServices = [...selectedOrder.services]
    
    if (field === 'serviceId') {
      const service = availableServices.find(s => s._id === value)
      if (service) {
        newServices[index] = {
          service: service,
          quantity: newServices[index].quantity || 0,
          price: service.price,
          subtotal: service.price * (newServices[index].quantity || 0)
        }
      }
    } else if (field === 'quantity') {
      newServices[index].quantity = parseFloat(value) || 0
      newServices[index].subtotal = newServices[index].service.price * (parseFloat(value) || 0)
    }
    
    setSelectedOrder({ ...selectedOrder, services: newServices })
  }

  const handleSaveServices = () => {
    const services = selectedOrder.services
      .filter(s => s.service._id && s.service._id !== '' && s.quantity > 0)
      .map(s => ({
        serviceId: s.service._id,
        quantity: s.quantity
      }))
    
    if (services.length === 0) {
      toast.error('Please select at least one service with quantity')
      return
    }
    
    handleModifyServices(services)
  }

  const openOrderDetail = async (order) => {
    try {
      const [orderResponse, servicesResponse] = await Promise.all([
        orderAPI.getOrderById(order._id),
        serviceAPI.getAllServices()
      ])
      
      setSelectedOrder(orderResponse.data)
      setAvailableServices(servicesResponse.data)
      setShowDetailModal(true)
      setNewStatus(orderResponse.data.status)
      setWeightForm({
        weight: orderResponse.data.actualWeight || '',
        services: orderResponse.data.services.map(s => ({
          serviceId: s.service._id,
          quantity: s.quantity
        }))
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load order details')
    }
  }

  const getStatusDisplay = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'accepted': 'Ready for Pickup',
      'picked-up': 'Picked Up - On the Store',
      'in-progress': 'On Going Services',
      'processed': 'Services Done',
      'for-delivery': 'To Be Deliver',
      'payment-received': 'Cash Payment Received',
      'delivered': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
      case 'accepted':
        return <Clock className="w-5 h-5" />;
      case 'picked-up':
      case 'in-progress':
      case 'processed':
        return <Package className="w-5 h-5" />;
      case 'for-delivery':
        return <Truck className="w-5 h-5" />;
      case 'payment-received':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'badge-warning',
      'accepted': 'badge-info',
      'picked-up': 'badge-primary',
      'in-progress': 'badge-secondary',
      'processed': 'badge-accent',
      'for-delivery': 'badge-accent',
      'payment-received': 'badge-success',
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
    if (activeTab === 'myTasks') {
      return myTasks
    } else if (activeTab === 'waitingToAccept') {
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
        o.status === 'for-delivery' ||
        o.status === 'out-for-delivery'
      )
    } else if (activeTab === 'completed') {
      // Show delivered or cancelled orders where this staff was assigned
      const completed = allOrders.filter(o => {
        const isCompleted = o.status === 'delivered' || o.status === 'cancelled'
        if (!isCompleted) return false
        
        // For staff, show ALL completed orders (they can see orders they worked on)
        return true
      })
      return completed
    }
    return allOrders
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  if (!user) return null

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <StaffSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <StaffNavbar toggleSidebar={toggleSidebar} />

      <div className="lg:ml-64 pt-28 md:pt-32 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Order Management</h1>
          </div>

          <div className="tabs tabs-boxed mb-6 bg-base-100 p-2">
            <a 
              className={`tab ${activeTab === 'myTasks' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('myTasks')}
            >
              My Task ({myTasks.length})
            </a>
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
                  {activeTab === 'myTasks' && 'No tasks assigned to you'}
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
                          <h4 className="text-xl font-bold">{order.orderNumber}</h4>
                          <span className={`badge ${getStatusBadge(order.status)} `}>
                            {getStatusDisplay(order.status)}
                          </span>
                        
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-2 text-sm">
                          <p className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {order.customer?.firstName || 'Guest'} {order.customer?.lastName || 'Customer'}
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
                            <Calendar className="h-4 w-4 text-accent" />
                            Delivery: {order.deliverDate ? new Date(order.deliverDate).toLocaleDateString() : 'N/A'}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-accent" />
                            {order.deliverTime || 'N/A'}
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
                                                <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setChatOpen(true);
                          }}
                          className="btn btn-sm btn-outline gap-2"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Chat
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
                    <p><span className="font-semibold">Name:</span> {selectedOrder.customer?.firstName || 'Guest'} {selectedOrder.customer?.lastName || 'Customer'}</p>
                    <p><span className="font-semibold">Email:</span> {selectedOrder.customer?.email || 'N/A'}</p>
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
                    <p><span className="font-semibold">Pickup Date:</span> {new Date(selectedOrder.pickupDate).toLocaleDateString()}</p>
                    <p><span className="font-semibold">Pickup Time:</span> {selectedOrder.pickupTime}</p>
                    <p><span className="font-semibold text-accent">Delivery Date:</span> {selectedOrder.deliverDate ? new Date(selectedOrder.deliverDate).toLocaleDateString() : 'N/A'}</p>
                    <p><span className="font-semibold text-accent">Delivery Time:</span> {selectedOrder.deliverTime || 'N/A'}</p>
                    <p><span className="font-semibold">Payment:</span> {selectedOrder.paymentMethod}</p>
                    <p><span className="font-semibold">Status:</span> <span className={`badge ${getStatusBadge(selectedOrder.status)}`}>{getStatusDisplay(selectedOrder.status)}</span></p>
                  </div>
                </div>
              </div><div className="card bg-base-200 lg:col-span-2">
                <div className="card-body">
                  <h4 className="font-bold flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Pickup Address
                  </h4>                  <p className="text-sm font-semibold mb-1">{selectedOrder.customer?.firstName || 'Guest'} {selectedOrder.customer?.lastName || 'Customer'}</p>                  <p className="text-sm mb-3">{selectedOrder.pickupAddress.fullAddress}</p>
                  {selectedOrder.pickupAddress.location?.coordinates[0] !== 0 && (
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
                        <div className="flex flex-col">
                          <span className="font-medium">{s.service.name}</span>
                          <span className="text-xs text-base-content/60">₱{s.service.price.toFixed(2)} per {s.service.unit}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>{s.quantity} {s.service.unit}</span>
                          <span className="font-semibold">₱{s.subtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    {selectedOrder.status !== 'pending' && selectedOrder.status !== 'accepted' && (
                      <>
                        <div className="divider my-2"></div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Services Subtotal:</span>
                          <span>₱{(selectedOrder.servicesSubtotal || selectedOrder.totalAmount - (selectedOrder.shippingFee || 0)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Shipping Fee:</span>
                          <span className={selectedOrder.shippingFee === 0 ? "text-success font-medium" : ""}>
                            {selectedOrder.shippingFee === 0 ? 'FREE' : `₱${(selectedOrder.shippingFee || 0).toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span className="text-primary">₱{selectedOrder.totalAmount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>{(() => {
                const userId = user?._id || user?.id;
                const isPickupStaff = selectedOrder?.assignedStaff?.pickup?._id === userId;
                
                // Only show service modification for pickup staff and status 'accepted'
                if (selectedOrder.status === 'accepted' && isPickupStaff) {
                  return (
                    <div className="card bg-base-200 lg:col-span-2">
                      <div className="card-body">
                        <h4 className="font-bold flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Modify Services
                        </h4>
                        <p className="text-sm text-base-content/60 mb-4">
                          Add or remove services based on customer request
                        </p>
                        <div className="space-y-3">
                          {selectedOrder.services.map((s, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <select
                                className="select select-bordered flex-1"
                                value={s.service._id}
                                onChange={(e) => handleServiceChange(idx, 'serviceId', e.target.value)}
                              >
                                <option value="">Select Service</option>
                                {availableServices.map(service => (
                                  <option key={service._id} value={service._id}>
                                    {service.name} - ₱{service.price}/{service.unit}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                className="input input-bordered w-32"
                                placeholder="Qty"
                                value={s.quantity || ''}
                                onChange={(e) => handleServiceChange(idx, 'quantity', e.target.value)}
                              />
                              <button
                                className="btn btn-error btn-sm"
                                onClick={() => handleRemoveService(idx)}
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={handleAddService}
                            >
                              + Add Service
                            </button>
                            <button
                              className="btn btn-primary btn-sm ml-auto"
                              onClick={handleSaveServices}
                              disabled={modifyingServices}
                            >
                              {modifyingServices ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}{(selectedOrder.assignedStaff?.pickup || selectedOrder.assignedStaff?.processing || selectedOrder.assignedStaff?.delivery) && (
                <div className="card bg-base-200 lg:col-span-2">
                  <div className="card-body">
                    <h4 className="font-bold flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Assigned Staff
                    </h4>
                    <div className="space-y-2 text-sm">
                      {selectedOrder.assignedStaff?.pickup && (
                        <p>
                          <span className="font-semibold">Pickup:</span>{' '}
                          {selectedOrder.assignedStaff.pickup.firstName} {selectedOrder.assignedStaff.pickup.lastName}
                        </p>
                      )}
                      {selectedOrder.assignedStaff?.processing && (
                        <p>
                          <span className="font-semibold">Processing:</span>{' '}
                          {selectedOrder.assignedStaff.processing.firstName} {selectedOrder.assignedStaff.processing.lastName}
                        </p>
                      )}
                      {selectedOrder.assignedStaff?.delivery && (
                        <p>
                          <span className="font-semibold">Delivery:</span>{' '}
                          {selectedOrder.assignedStaff.delivery.firstName} {selectedOrder.assignedStaff.delivery.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}{selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div className="card bg-base-200 lg:col-span-2">
                  <div className="card-body">
                    <h4 className="font-bold flex items-center gap-2 mb-3">
                      <Clock className="h-5 w-5" />
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
                              <span className={`badge ${getStatusBadge(history.status)} badge-sm`}>
                                {getStatusDisplay(history.status)}
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

              {selectedOrder.status === 'cancelled' && selectedOrder.notes && selectedOrder.notes.length > 0 && (() => {
                const cancellationNote = selectedOrder.notes.find(n => n.note?.startsWith('Cancellation reason:'))
                if (cancellationNote) {
                  const reason = cancellationNote.note.replace('Cancellation reason: ', '')
                  return (
                    <div className="card bg-error/10 border border-error/30 lg:col-span-2">
                      <div className="card-body">
                        <h4 className="font-bold flex items-center gap-2 text-error">
                          <XCircle className="h-5 w-5" />
                          Cancellation Reason
                        </h4>
                        <p className="text-sm mt-2">{reason || 'No reason provided'}</p>
                        {cancellationNote.timestamp && (
                          <p className="text-xs text-base-content/60 mt-1">
                            Cancelled on {new Date(cancellationNote.timestamp).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              {(() => {
                const userId = user?._id || user?.id;
                const isAssigned = selectedOrder?.assignedStaff?.pickup?._id === userId ||
                                   selectedOrder?.assignedStaff?.processing?._id === userId ||
                                   selectedOrder?.assignedStaff?.delivery?._id === userId;
                
                // Show image section for assigned staff only
                if (isAssigned && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled') {
                  return (
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
                  );
                }
                return null;
              })()}
            </div>

            <div className="modal-action">
              <button 
                onClick={() => {
                  setSelectedOrder(selectedOrder);
                  setChatOpen(true);
                }}
                className="btn btn-outline gap-2"
              >
                <MessageSquare className="h-5 w-5" />
                Open Chat
              </button>
              
              {(() => {
                const userId = user?._id || user?.id;
                const isPickupStaff = selectedOrder?.assignedStaff?.pickup?._id === userId;
                const isProcessingStaff = selectedOrder?.assignedStaff?.processing?._id === userId;
                const isDeliveryStaff = selectedOrder?.assignedStaff?.delivery?._id === userId;
                
                // Show button only if assigned to current stage
                const canAdvance = 
                  (selectedOrder?.status === 'accepted' && isPickupStaff) ||
                  (selectedOrder?.status === 'picked-up' && isProcessingStaff) ||
                  (selectedOrder?.status === 'in-progress' && isProcessingStaff) ||
                  (selectedOrder?.status === 'processed' && isDeliveryStaff) ||
                  (selectedOrder?.status === 'for-delivery' && isDeliveryStaff);
                
                if (!canAdvance) return null;

                // Check if payment is required and not received
                const needsPayment = selectedOrder?.status === 'for-delivery' && 
                                     selectedOrder?.paymentMethod === 'cash' && 
                                     selectedOrder?.paymentStatus !== 'paid';
                
                return (
                  <>
                    {needsPayment && (
                      <button
                        className="btn btn-success"
                        onClick={handleMarkPaymentReceived}
                        disabled={updatingOrder}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Cash Payment Received
                      </button>
                    )}
                    <button
                      className={`btn btn-primary ${
                        (selectedOrder.status === 'accepted' && 
                        !selectedOrder.services.every(s => s.quantity > 0)) ||
                        needsPayment
                          ? 'btn-disabled' 
                          : ''
                      }`}
                      onClick={handleAdvanceStatus}
                      disabled={
                        updatingOrder ||
                        (selectedOrder.status === 'accepted' && 
                        !selectedOrder.services.every(s => s.quantity > 0)) ||
                        needsPayment
                      }
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {selectedOrder.status === 'accepted' && 'Mark as Picked Up'}
                      {selectedOrder.status === 'picked-up' && 'Start Services'}
                      {selectedOrder.status === 'in-progress' && 'Mark as Done'}
                      {selectedOrder.status === 'processed' && 'Ready for Delivery'}
                      {selectedOrder.status === 'for-delivery' && 'Mark as Delivered'}
                    </button>
                  </>
                );
              })()}

              <button onClick={() => setShowDetailModal(false)} className="btn btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderChat 
          orderId={selectedOrder._id}
          currentUser={user}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  )
}

export default StaffOrders


