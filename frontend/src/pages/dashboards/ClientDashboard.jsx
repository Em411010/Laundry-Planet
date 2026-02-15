import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ClientSidebar, ClientNavbar } from '../../components/navbars/ClientNavbar'
import { orderAPI, serviceAPI, messageAPI, settingsAPI, paymentAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { 
  Package, Clock, CheckCircle2, TruckIcon, 
  Calendar, DollarSign, FileText, Sparkles,
  ShoppingBag, ArrowRight, Truck, MapPin, Send,
  MessageCircle, History, AlertCircle, CreditCard
} from 'lucide-react'

const ClientDashboard = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [completedOrders, setCompletedOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingCompleted, setLoadingCompleted] = useState(true)
  const [services, setServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [shippingSettings, setShippingSettings] = useState({ shippingFee: 0, freeShippingThreshold: 0 })
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [activeTab, setActiveTab] = useState('active')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatSending, setChatSending] = useState(false)
  const [payingOrders, setPayingOrders] = useState(new Set())

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      navigate('/login')
    }
  }, [navigate])

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'active' || tab === 'completed') {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    if (user) {
      loadActiveOrders()
      loadCompletedOrders()
      loadServices()
      loadShippingSettings()
    }
  }, [user])

  useEffect(() => {
    if (selectedOrder) {
      loadChatMessages(selectedOrder._id)
    }
  }, [selectedOrder])

  const loadActiveOrders = async () => {
    try {
      setLoadingOrders(true)
      const res = await orderAPI.getMyOrders()
      // active = not delivered and not cancelled
      const active = (res.data || []).filter(o => o.status && !['delivered','cancelled','completed'].includes(o.status))
      setOrders(active)
    } catch {
      setOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }

  const loadCompletedOrders = async () => {
    try {
      setLoadingCompleted(true)
      const res = await orderAPI.getMyOrders()
      const completed = (res.data || []).filter(o => ['delivered', 'completed'].includes(o.status))
      setCompletedOrders(completed.reverse())
    } catch {
      setCompletedOrders([])
    } finally {
      setLoadingCompleted(false)
    }
  }

  const loadServices = async () => {
    try {
      setLoadingServices(true)
      const res = await serviceAPI.getPublicServices()
      setServices(res.data || [])
    } catch {
      setServices([])
    } finally {
      setLoadingServices(false)
    }
  }

  const loadShippingSettings = async () => {
    try {
      const res = await settingsAPI.getShippingSettings()
      if (res.data) {
        setShippingSettings({
          shippingFee: res.data.shippingFee || 0,
          freeShippingThreshold: res.data.freeShippingThreshold || 0
        })
      }
    } catch (error) {
      console.error('Failed to load shipping settings:', error)
    }
  }

  const loadChatMessages = async (orderId) => {
    try {
      setChatLoading(true)
      const messages = await messageAPI.getOrderMessages(orderId)
      setChatMessages(messages)
    } catch (error) {
      console.error('Error loading chat messages:', error)
      setChatMessages([])
    } finally {
      setChatLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedOrder) return

    try {
      setChatSending(true)
      const message = await messageAPI.sendMessage(selectedOrder._id, newMessage.trim())
      setChatMessages([...chatMessages, message])
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setChatSending(false)
    }
  }

  const getStatusSequence = () => {
    return [
     { status: 'pending', label: 'Order Submitted', icon: Package },
      { status: 'accepted', label: 'Awaiting Pickup', icon: Clock },
      { status: 'picked-up', label: 'On the Shop', icon: TruckIcon },
      { status: 'in-progress', label: 'Processing', icon: MapPin },
      { status: 'processed', label: 'Services Done', icon: Package },
      { status: 'for-delivery', label: 'Ready for Delivery', icon: CheckCircle2 },
      { status: 'delivered', label: 'Delivered', icon: TruckIcon },
      { status: 'cancelled', label: 'Cancelled', icon: CheckCircle2 }
    ]
  }

  const isStatusCompleted = (statusToCheck) => {
    if (!selectedOrder) return false
    const sequence = getStatusSequence()
    const currentIndex = sequence.findIndex(s => s.status === selectedOrder.status)
    const checkIndex = sequence.findIndex(s => s.status === statusToCheck)
    return checkIndex <= currentIndex
  }

  const getEstimatedCompletion = () => {
    if (!selectedOrder) return null
    if (!selectedOrder.deliverDate) return 'TBD'
    try {
      const date = new Date(selectedOrder.deliverDate)
      if (isNaN(date.getTime())) return 'TBD'
      return `${date.toLocaleDateString()} ${selectedOrder.deliverTime ? `at ${selectedOrder.deliverTime}` : ''}`
    } catch {
      return 'TBD'
    }
  }

  const handleReorder = (order) => {
    navigate('/dashboard/client/new-order', { state: { previousOrder: order } })
  }

  const handleBookPickup = () => navigate('/dashboard/client/new-order')

  const handleViewReceipts = () => navigate('/dashboard/client/receipts')

  const handleViewOrder = async (order) => {
    setSelectedOrder(order)
  }

  const canPayNow = (order) => {
    // Client can pay after staff weighs the laundry (actualWeight is set)
    return (
      order.paymentMethod === 'gcash' &&
      order.paymentStatus === 'unpaid' &&
      order.actualWeight && order.actualWeight > 0 && // Payment available after weighing
      !order.paymentDetails?.paymongoPaymentId
    )
  }

  const handleGCashPayment = async (orderId) => {
    if (payingOrders.has(orderId)) return

    setPayingOrders(prev => new Set(prev).add(orderId))
    const loadingToast = toast.loading('Initiating GCash payment...')

    try {
      const response = await paymentAPI.initiateGCashPayment(orderId)
      
      if (response.success && response.data?.checkoutUrl) {
        toast.success('Redirecting to GCash payment...', { id: loadingToast })
        // Redirect to PayMongo GCash checkout
        window.location.href = response.data.checkoutUrl
      } else {
        throw new Error(response.message || 'Failed to create payment link')
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to initiate GCash payment', { id: loadingToast })
      setPayingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <ClientSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <ClientNavbar toggleSidebar={toggleSidebar} />

      <div className="lg:ml-64 pt-32 mt-12 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Welcome back, {user.firstName}!
                </h1>
                <p className="text-base-content/60 mt-1 flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  Ready to manage your laundry orders
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleBookPickup} className="btn btn-primary gap-2">
                  <ShoppingBag size={18} />
                  Book Pickup
                </button>
                <button onClick={handleViewReceipts} className="btn btn-outline gap-2">
                  <FileText size={18} />
                  Receipts
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="stats shadow bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <Package size={32} />
                </div>
                <div className="stat-title">Active Orders</div>
                <div className="stat-value text-primary">{orders.length}</div>
                <div className="stat-desc">Currently processing</div>
              </div>
            </div>

            <div className="stats shadow bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20">
              <div className="stat">
                <div className="stat-figure text-secondary">
                  <Clock size={32} />
                </div>
                <div className="stat-title">Pending</div>
                <div className="stat-value text-secondary">
                  {orders.filter(o => ['pending', 'processing'].includes(o.status)).length}
                </div>
                <div className="stat-desc">Awaiting pickup</div>
              </div>
            </div>

            <div className="stats shadow bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
              <div className="stat">
                <div className="stat-figure text-success">
                  <TruckIcon size={32} />
                </div>
                <div className="stat-title">In Transit</div>
                <div className="stat-value text-success">
                  {orders.filter(o => ['ready_for_delivery', 'out_for_delivery'].includes(o.status)).length}
                </div>
                <div className="stat-desc">On the way</div>
              </div>
            </div>

            <div className="stats shadow bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
              <div className="stat">
                <div className="stat-figure text-accent">
                  <DollarSign size={32} />
                </div>
                <div className="stat-title">Total Value</div>
                <div className="stat-value text-accent">
                  ₱{orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toFixed(0)}
                </div>
                <div className="stat-desc">Active orders</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={() => setActiveTab('active')}
                  className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-outline'}`}
                >
                  <Package size={18} />
                  Active Orders
                </button>
                <button 
                  onClick={() => setActiveTab('completed')}
                  className={`btn ${activeTab === 'completed' ? 'btn-primary' : 'btn-outline'}`}
                >
                  <History size={18} />
                  Order History
                </button>
              </div>

              {activeTab === 'active' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Package size={24} className="text-primary" />
                      Active Orders
                    </h2>
                    {orders.length > 0 && (
                      <span className="badge badge-primary">{orders.length} active</span>
                    )}
                  </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  {loadingOrders ? (
                    <div className="py-12 flex flex-col items-center justify-center">
                      <span className="loading loading-spinner loading-lg text-primary"></span>
                      <p className="text-sm text-base-content/60 mt-4">Loading orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 mb-4">
                        <Package size={32} className="text-base-content/40" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">No Active Orders</h3>
                      <p className="text-base-content/60 mb-6">Ready to get your laundry done?</p>
                      <button onClick={handleBookPickup} className="btn btn-primary gap-2">
                        <ShoppingBag size={18} />
                        Book Your First Pickup
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((o) => {
                        const statusConfig = {
                          pending: { icon: Clock, color: 'warning', text: 'Pending' },
                          processing: { icon: Package, color: 'info', text: 'Processing' },
                          ready_for_delivery: { icon: CheckCircle2, color: 'success', text: 'Ready' },
                          out_for_delivery: { icon: TruckIcon, color: 'primary', text: 'Out for Delivery' }
                        }
                        const config = statusConfig[o.status] || { icon: Package, color: 'neutral', text: o.status }
                        const StatusIcon = config.icon

                        return (
                          <div key={o._id} className="card bg-gradient-to-br from-base-100 to-base-200 hover:shadow-lg transition-all duration-200 border border-base-300">
                            <div className="card-body p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`badge badge-${config.color} gap-1`}>
                                      <StatusIcon size={14} />
                                      {config.text}
                                    </span>
                                    <span className="text-xs text-base-content/60 font-mono">{o.orderNumber}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-base-content/70 mb-3">
                                    <Calendar size={14} />
                                    <span>{o.deliverDate ? new Date(o.deliverDate).toLocaleDateString() : 'N/A'}</span>
                                    <Clock size={14} className="ml-2" />
                                    <span>{o.deliverTime || 'N/A'}</span>
                                  </div>

                                  <div className="space-y-1">
                                    {(o.services || []).slice(0, 2).map((s, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                          <div className="w-1 h-1 rounded-full bg-primary"></div>
                                          <span className="text-base-content/80">{s.service.name}</span>
                                          <span className="badge badge-ghost badge-xs">× {s.quantity}</span>
                                        </div>
                                        <span className="font-semibold">₱{(s.subtotal || 0).toFixed(2)}</span>
                                      </div>
                                    ))}
                                    {o.services && o.services.length > 2 && (
                                      <div className="text-xs text-base-content/50 pl-3">
                                        +{o.services.length - 2} more items
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="text-right flex flex-col items-end gap-2">
                                  <div className="text-right">
                                    <div className="text-xs text-base-content/60 mb-1">Total Amount</div>
                                    <div className="text-2xl font-bold text-primary">₱{(o.totalAmount || 0).toFixed(2)}</div>
                                    {o.shippingFee !== undefined && (
                                      <div className="text-xs text-base-content/60 mt-1">
                                        Shipping: {o.shippingFee === 0 ? <span className="text-success">FREE</span> : `₱${o.shippingFee}`}
                                      </div>
                                    )}
                                    {o.paymentMethod === 'gcash' && o.paymentStatus === 'unpaid' && (
                                      <div className="badge badge-warning badge-sm mt-1">Payment Pending</div>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <button 
                                      onClick={() => handleViewOrder(o)} 
                                      className="btn btn-primary btn-sm gap-1"
                                    >
                                      View Details
                                      <ArrowRight size={14} />
                                    </button>
                                    {canPayNow(o) && (
                                      <button 
                                        onClick={() => handleGCashPayment(o._id)}
                                        disabled={payingOrders.has(o._id)}
                                        className="btn btn-success btn-sm gap-1"
                                      >
                                        {payingOrders.has(o._id) ? (
                                          <span className="loading loading-spinner loading-xs"></span>
                                        ) : (
                                          <CreditCard size={14} />
                                        )}
                                        Pay via GCash
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
              )}

              {activeTab === 'completed' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <History size={24} className="text-primary" />
                      Order History
                    </h2>
                    {completedOrders.length > 0 && (
                      <span className="badge badge-accent">{completedOrders.length} completed</span>
                    )}
                  </div>

                  <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      {loadingCompleted ? (
                        <div className="py-12 flex flex-col items-center justify-center">
                          <span className="loading loading-spinner loading-lg text-primary"></span>
                          <p className="text-sm text-base-content/60 mt-4">Loading order history...</p>
                        </div>
                      ) : completedOrders.length === 0 ? (
                        <div className="py-12 text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 mb-4">
                            <History size={32} className="text-base-content/40" />
                          </div>
                          <h3 className="font-semibold text-lg mb-2">No Completed Orders</h3>
                          <p className="text-base-content/60 mb-6">Your finished orders will appear here</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {completedOrders.map((o) => (
                            <div key={o._id} className="card bg-gradient-to-br from-base-100 to-base-200 hover:shadow-lg transition-all duration-200 border border-success/30">
                              <div className="card-body p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="badge badge-success gap-1">
                                        <CheckCircle2 size={14} />
                                        Completed
                                      </span>
                                      <span className="text-xs text-base-content/60 font-mono">{o.orderNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-base-content/70 mb-3">
                                      <Calendar size={14} />
                                      <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                                      <DollarSign size={14} className="ml-2" />
                                      <span>₱{(o.totalAmount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="space-y-1">
                                      {(o.services || []).slice(0, 2).map((s, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                          <div className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-success"></div>
                                            <span className="text-base-content/80">{s.service.name}</span>
                                          </div>
                                        </div>
                                      ))}
                                      {o.services && o.services.length > 2 && (
                                        <div className="text-xs text-base-content/50 pl-3">+{o.services.length - 2} more</div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <button 
                                      onClick={() => handleReorder(o)}
                                      className="btn btn-primary btn-sm gap-1"
                                    >
                                      <ShoppingBag size={14} />
                                      Reorder
                                    </button>
                                    <button 
                                      onClick={() => navigate('/dashboard/client/receipts')}
                                      className="btn btn-outline btn-sm gap-1"
                                    >
                                      <FileText size={14} />
                                      Receipt
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title text-lg flex items-center gap-2">
                    <Truck size={20} className="text-primary" />
                    Detailed Tracking
                  </h3>
                  <div className="divider my-2"></div>
                  {selectedOrder ? (
                    <div>
                      <div className="alert alert-info mb-4">
                        <AlertCircle size={20} />
                        <div>
                          <div className="font-semibold">{selectedOrder.orderNumber}</div>
                          <div className="text-sm capitalize">{selectedOrder.status.replace(/_/g, ' ')}</div>
                          {getEstimatedCompletion() && (
                            <div className="text-xs mt-1">Est. Completion: {getEstimatedCompletion()}</div>
                          )}
                        </div>
                      </div>
                      <ul className="steps steps-vertical w-full text-sm">
                        {getStatusSequence().map((step, i) => {
                          const isCompleted = isStatusCompleted(step.status)
                          const isCurrent = selectedOrder.status === step.status
                          const StepIcon = step.icon
                          const statusRecord = selectedOrder.statusHistory?.find(h => h.status === step.status)
                          let timestampDisplay = null
                          
                          if (statusRecord && statusRecord.createdAt) {
                            try {
                              const date = new Date(statusRecord.createdAt)
                              if (!isNaN(date.getTime())) {
                                timestampDisplay = date.toLocaleString()
                              }
                            } catch {
                              timestampDisplay = null
                            }
                          }
                          
                          return (
                            <li key={i} className={`step ${isCompleted || isCurrent ? 'step-primary' : 'step-neutral'}`}>
                              <div className={`text-left w-full p-2 rounded-lg transition-all ${isCurrent ? 'bg-primary/20 border-l-4 border-primary pl-3' : ''}`}>
                                <div className="flex items-center gap-2">
                                  <StepIcon size={14} className={isCurrent ? 'text-primary font-bold' : ''} />
                                  <div>
                                    <div className={`font-medium ${isCurrent ? 'text-primary font-bold text-base' : ''}`}>
                                      {step.label}
                                    </div>
                                    {timestampDisplay && (
                                      <div className="text-xs text-base-content/60">
                                        {timestampDisplay}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-base-200 mb-3">
                        <Clock size={24} className="text-base-content/40" />
                      </div>
                      <p className="text-sm text-base-content/60">Select an order to track progress</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title text-lg flex items-center gap-2">
                    <MessageCircle size={20} className="text-primary" />
                    Chat with Staff
                  </h3>
                  <div className="divider my-2"></div>
                  <div className="flex flex-col h-96">
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                      {chatLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <span className="loading loading-spinner text-primary"></span>
                        </div>
                      ) : !selectedOrder ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-sm text-base-content/60">Select an order to chat with assigned staff</p>
                        </div>
                      ) : chatMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-sm text-base-content/60">No messages yet. Start a conversation!</p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const isYou = msg.senderRole === 'customer'
                          const senderName = msg.sender?.firstName ? `${msg.sender.firstName} ${msg.sender.lastName || ''}` : 'Unknown'
                          return (
                            <div key={msg._id} className={`flex ${isYou ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-xs p-3 rounded-lg ${isYou ? 'bg-primary text-primary-content' : 'bg-base-200'}`}>
                                <p className="text-xs font-semibold mb-1">{isYou ? 'You' : senderName}</p>
                                <p className="text-sm">{msg.content}</p>
                                <p className="text-xs opacity-75 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !chatSending && handleSendMessage()}
                        placeholder={selectedOrder ? "Type your message..." : "Select an order first..."}
                        disabled={!selectedOrder || chatSending}
                        className="input input-bordered flex-1 input-sm disabled:opacity-50"
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={!selectedOrder || !newMessage.trim() || chatSending}
                        className="btn btn-primary btn-sm gap-1 disabled:opacity-50"
                      >
                        {chatSending ? <span className="loading loading-spinner loading-sm"></span> : <Send size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title text-lg flex items-center gap-2">
                    <DollarSign size={20} className="text-primary" />
                    Current Pricing
                  </h3>
                  <div className="divider my-2"></div>
                  {loadingServices ? (
                    <div className="py-8 flex flex-col items-center justify-center">
                      <span className="loading loading-spinner text-primary"></span>
                      <p className="text-sm text-base-content/60 mt-3">Loading services...</p>
                    </div>
                  ) : services.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-base-content/60">No services available</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {services.filter(s => s.unit !== 'FREE').map(s => (
                        <div key={s._id} className="flex items-center justify-between p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors">
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{s.name}</div>
                            <div className="text-xs text-base-content/60">
                              {s.unit} • Min: {s.minRequirement}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary">₱{s.price.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Free Delivery Info */}
                  <div className="divider my-2"></div>
                  <div className="alert alert-info">
                    <Truck size={20} />
                    <div>
                      <div className="font-semibold">Free Delivery Available!</div>
                      <div className="text-sm">Orders of {shippingSettings.freeShippingThreshold} kg or more qualify for free delivery</div>
                      <div className="text-xs mt-1 opacity-75">Delivery fee: ₱{shippingSettings.shippingFee.toFixed(2)} for orders below threshold</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-xl border-2 border-primary/20">
                <div className="card-body">
                  <h3 className="card-title text-lg flex items-center gap-2">
                    <Sparkles size={20} className="text-primary" />
                    Quick Tips
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-success mt-0.5 flex-shrink-0" />
                      <span>Book pickup at least 24 hours in advance</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-success mt-0.5 flex-shrink-0" />
                      <span>Track your order in real-time</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-success mt-0.5 flex-shrink-0" />
                      <span>Chat with staff for any concerns</span>
                    </div>
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

export default ClientDashboard
