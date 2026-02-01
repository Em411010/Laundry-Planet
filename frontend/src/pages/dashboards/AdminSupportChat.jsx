import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Send, MessageSquare, Loader, Users, ArrowLeft, Clock, Mail, Phone, MapPin, Calendar, Package, TrendingUp } from 'lucide-react'
import { messageAPI, userAPI, orderAPI } from '../../services/api'
import { AdminSidebar, AdminNavbar } from '../../components/navbars/AdminNavbar'

const AdminSupportChat = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [orderMessages, setOrderMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list', 'conversation', or 'orderChat'
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [clientDetails, setClientDetails] = useState(null)
  const [clientOrders, setClientOrders] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (!savedUser) {
      navigate('/login')
      return
    }
    setUser(JSON.parse(savedUser))
  }, [navigate])

  useEffect(() => {
    if (user) {
      const orderId = searchParams.get('orderId')
      if (orderId) {
        loadOrderChat(orderId)
      } else {
        loadSupportMessages()
      }
    }
  }, [user, searchParams])

  const loadOrderChat = async (orderId) => {
    try {
      setIsLoading(true)
      setViewMode('orderChat')
      
      // Fetch order details and messages
      const [orderResponse, messagesResponse] = await Promise.all([
        orderAPI.getOrderById(orderId),
        messageAPI.getOrderMessages(orderId)
      ])
      
      setSelectedOrder(orderResponse.data || orderResponse)
      setOrderMessages(messagesResponse || [])
    } catch (error) {
      console.error('Admin: Error loading order chat:', error)
      setOrderMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadSupportMessages = async () => {
    try {
      setIsLoading(true)
      setViewMode('list')
      console.log('Admin: Loading support messages...')
      const response = await messageAPI.getSupportMessages()
      console.log('Admin: Support messages loaded:', response)
      setMessages(response || [])
    } catch (error) {
      console.error('Admin: Error loading support messages:', error)
      console.error('Admin: Error response:', error.response?.data)
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  // Group messages by client and get latest message for each
  const getClientConversations = () => {
    const clientMap = new Map()

    messages.forEach(msg => {
      if (msg.senderRole === 'client') {
        const clientId = msg.sender._id
        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            client: msg.sender,
            lastMessage: msg,
            messageCount: 0,
            unreadCount: 0
          })
        }
        
        const conversation = clientMap.get(clientId)
        conversation.messageCount++
        
        // Update last message if this is newer
        if (new Date(msg.createdAt) > new Date(conversation.lastMessage.createdAt)) {
          conversation.lastMessage = msg
        }
        
        // Count unread messages (messages from client that admin hasn't read)
        if (msg.senderRole === 'client' && !msg.read) {
          conversation.unreadCount++
        }
      }
    })

    // Convert to array and sort by newest first
    return Array.from(clientMap.values()).sort((a, b) => 
      new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    )
  }

  const handleClientSelect = (client) => {
    setSelectedClient(client)
    setViewMode('conversation')
    setInputValue('')
    fetchClientDetails(client.client._id)
  }

  const fetchClientDetails = async (clientId) => {
    try {
      setLoadingDetails(true)
      const userResponse = await userAPI.getUserById(clientId)
      setClientDetails(userResponse.data)
      
      // Fetch client orders using getAllOrders with client filter
      const ordersResponse = await orderAPI.getAllOrders({ clientId })
      setClientOrders(ordersResponse.data || [])
    } catch (error) {
      console.error('Error fetching client details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedClient(null)
    setInputValue('')
  }

  const getConversationMessages = () => {
    if (!selectedClient) return []
    
    return messages.filter(msg => 
      msg.sender._id === selectedClient.client._id || 
      (msg.senderRole === 'admin' && msg.sender._id === user._id)
    ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    try {
      setIsSending(true)
      console.log('Admin: Sending support message:', inputValue)
      const response = await messageAPI.sendSupportMessage(inputValue)
      console.log('Admin: Support message sent successfully:', response)

      // Add message to UI
      const newMessage = {
        _id: response._id || response.id || Date.now().toString(),
        sender: user,
        senderRole: 'admin',
        content: inputValue,
        createdAt: new Date().toISOString()
      }

      setMessages(prev => [...prev, newMessage])
      setInputValue('')
    } catch (error) {
      console.error('Admin: Error sending message:', error)
      console.error('Admin: Error response:', error.response?.data)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <AdminSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <AdminNavbar toggleSidebar={toggleSidebar} />

      <div className="lg:ml-64 pt-32 mt-12 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="text-primary" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {viewMode === 'conversation' 
                    ? `${selectedClient?.client?.firstName} ${selectedClient?.client?.lastName}` 
                    : viewMode === 'orderChat'
                    ? 'Order Staff-Client Chat'
                    : 'Customer Support'}
                </h1>
                <p className="text-base-content/60">
                  {viewMode === 'conversation' 
                    ? 'Chat with this customer' 
                    : viewMode === 'orderChat'
                    ? 'View all staff and client conversations for this order'
                    : 'Chat with customers and handle support requests'}
                </p>
              </div>
            </div>
            {viewMode === 'conversation' && (
              <button
                onClick={handleBackToList}
                className="btn btn-ghost btn-sm gap-2"
              >
                <ArrowLeft size={16} />
                Back to Conversations
              </button>
            )}
          </div>

          {viewMode === 'list' ? (
            /* Conversations List */
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader className="animate-spin mx-auto mb-2 text-primary" size={32} />
                    <p className="text-base-content/60">Loading conversations...</p>
                  </div>
                </div>
              ) : getClientConversations().length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto mb-3 text-base-content/40" size={40} />
                  <p className="text-base-content/60">No customer conversations yet.</p>
                </div>
              ) : (
                getClientConversations().map((conversation) => (
                  <div
                    key={conversation.client._id}
                    onClick={() => handleClientSelect(conversation)}
                    className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-base-300"
                  >
                    <div className="card-body p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="avatar placeholder">
                              <div className="bg-primary text-primary-content rounded-full w-10 h-10">
                                <span className="text-sm font-semibold">
                                  {conversation.client.firstName?.[0]}{conversation.client.lastName?.[0]}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg truncate">
                                {conversation.client.firstName} {conversation.client.lastName}
                              </h3>
                              <p className="text-sm text-base-content/60 truncate">
                                {conversation.lastMessage.content.length > 100 
                                  ? `${conversation.lastMessage.content.substring(0, 100)}...` 
                                  : conversation.lastMessage.content}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="flex items-center gap-2 text-sm text-base-content/60 mb-1">
                            <Clock size={14} />
                            {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-base-content/60">
                            {new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {conversation.unreadCount > 0 && (
                            <div className="badge badge-primary badge-sm mt-1">
                              {conversation.unreadCount} new
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : viewMode === 'orderChat' ? (
            <div className="space-y-6">
              <button
                onClick={() => navigate('/dashboard/admin/orders')}
                className="btn btn-ghost btn-sm gap-2"
              >
                <ArrowLeft size={16} />
                Back to Orders
              </button>

              {selectedOrder && (
                <div className="card bg-base-100 shadow-lg">
                  <div className="card-body">
                    <h3 className="card-title text-lg flex items-center gap-2">
                      <Package size={20} />
                      Order #{selectedOrder.orderNumber || selectedOrder._id?.slice(-8)}
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4 mt-2">
                      <div>
                        <p className="text-sm text-base-content/60">Customer</p>
                        <p className="font-semibold">{selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-base-content/60">Status</p>
                        <span className={`badge ${
                          selectedOrder.status === 'completed' ? 'badge-success' :
                          selectedOrder.status === 'pending' ? 'badge-warning' :
                          selectedOrder.status === 'cancelled' ? 'badge-error' : 'badge-info'
                        }`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-base-content/60">Total Amount</p>
                        <p className="font-semibold">₱{selectedOrder.totalAmount || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h3 className="card-title text-lg flex items-center gap-2 mb-4">
                    <MessageSquare size={20} />
                    Staff-Client Conversations
                  </h3>
                  
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Loader className="animate-spin mx-auto mb-2 text-primary" size={32} />
                        <p className="text-base-content/60">Loading messages...</p>
                      </div>
                    </div>
                  ) : orderMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="mx-auto mb-3 text-base-content/40" size={40} />
                      <p className="text-base-content/60">No messages in this order yet.</p>
                      <p className="text-sm text-base-content/50 mt-2">Staff and client conversations will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto p-4 bg-base-200 rounded-lg">
                      {orderMessages.map((msg) => {
                        const isStaff = msg.senderRole === 'staff'
                        const isClient = msg.senderRole === 'client'
                        const isAdmin = msg.senderRole === 'admin'
                        
                        return (
                          <div
                            key={msg._id}
                            className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}
                          >
                            <div className="max-w-[70%]">
                              <div
                                className={`px-4 py-3 rounded-lg ${
                                  isClient
                                    ? 'bg-info/20 text-info-content border border-info/30'
                                    : isStaff
                                    ? 'bg-success/20 text-success-content border border-success/30'
                                    : 'bg-primary/20 text-primary-content border border-primary/30'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-xs font-semibold opacity-75">
                                    {msg.sender?.firstName || 'Unknown'} {msg.sender?.lastName || ''}
                                  </p>
                                  <span className={`badge badge-xs ${
                                    isClient ? 'badge-info' :
                                    isStaff ? 'badge-success' : 'badge-primary'
                                  }`}>
                                    {msg.senderRole}
                                  </span>
                                </div>
                                <p className="text-sm break-words">{msg.content}</p>
                                <p className="text-xs mt-2 opacity-60">
                                  {new Date(msg.createdAt).toLocaleDateString()} at{' '}
                                  {new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="alert alert-info mt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className="text-sm">This is a read-only view of staff-client conversations for this order. Only assigned staff and the client can send messages.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="card bg-base-100 shadow-lg h-[600px] flex flex-col">
                  <div className="flex-1 overflow-y-auto p-6 border-b border-base-300">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Loader className="animate-spin mx-auto mb-2 text-primary" size={32} />
                          <p className="text-base-content/60">Loading messages...</p>
                        </div>
                      </div>
                    ) : getConversationMessages().length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageSquare className="mx-auto mb-3 text-base-content/40" size={40} />
                          <p className="text-base-content/60">No messages in this conversation yet.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getConversationMessages().map((msg) => {
                          const isAdmin = msg.senderRole === 'admin'
                          return (
                            <div
                              key={msg._id}
                              className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  isAdmin
                                    ? 'bg-primary text-primary-content'
                                    : 'bg-base-200 text-base-content'
                                }`}
                              >
                                {!isAdmin && (
                                  <p className="text-xs font-semibold opacity-75 mb-1">
                                    {msg.sender?.firstName || 'Customer'}
                                  </p>
                                )}
                                <p className="text-sm break-words">{msg.content}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isAdmin ? 'opacity-75' : 'opacity-60'
                                  }`}
                                >
                                  {new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-base-100 rounded-b-2xl">
                    <div className="flex gap-3">
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your response here... (Shift+Enter for new line)"
                        className="textarea textarea-bordered flex-1 resize-none"
                        rows="2"
                        disabled={isSending}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isSending}
                        className="btn btn-primary gap-2 self-end"
                      >
                        {isSending ? (
                          <Loader size={18} className="animate-spin" />
                        ) : (
                          <Send size={18} />
                        )}
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                {loadingDetails ? (
                  <div className="card bg-base-100 shadow-lg p-6">
                    <div className="flex items-center justify-center py-12">
                      <Loader className="animate-spin text-primary" size={32} />
                    </div>
                  </div>
                ) : clientDetails ? (
                  <div className="space-y-4">
                    {/* User Profile Card */}
                    <div className="card bg-base-100 shadow-lg">
                      <div className="card-body">
                        <h3 className="card-title text-lg mb-4">Customer Details</h3>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Mail size={18} className="text-primary" />
                            <div>
                              <p className="text-sm text-base-content/60">Email</p>
                              <p className="font-semibold">{clientDetails.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Phone size={18} className="text-primary" />
                            <div>
                              <p className="text-sm text-base-content/60">Phone</p>
                              <p className="font-semibold">{clientDetails.phone || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <MapPin size={18} className="text-primary" />
                            <div>
                              <p className="text-sm text-base-content/60">Address</p>
                              <p className="font-semibold text-sm">
                                {typeof clientDetails.address === 'object' && clientDetails.address
                                  ? clientDetails.address.fullAddress || 
                                    `${clientDetails.address.street}, ${clientDetails.address.barangay}, ${clientDetails.address.city}`
                                  : clientDetails.address || 'N/A'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Calendar size={18} className="text-primary" />
                            <div>
                              <p className="text-sm text-base-content/60">Member Since</p>
                              <p className="font-semibold">
                                {new Date(clientDetails.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Current/Recent Order */}
                    {clientOrders.length > 0 && (
                      <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                          <h3 className="card-title text-lg flex items-center gap-2 mb-4">
                            <Package size={20} />
                            Current Order
                          </h3>
                          
                          {clientOrders[0] && (
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-base-content/60">Order ID</span>
                                <span className="font-semibold text-sm">#{clientOrders[0]._id.slice(-8)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-base-content/60">Status</span>
                                <span className={`badge ${
                                  clientOrders[0].status === 'completed' ? 'badge-success' :
                                  clientOrders[0].status === 'pending' ? 'badge-warning' :
                                  clientOrders[0].status === 'cancelled' ? 'badge-error' : 'badge-info'
                                }`}>
                                  {clientOrders[0].status}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-base-content/60">Amount</span>
                                <span className="font-semibold">₱{clientOrders[0].totalAmount || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-base-content/60">Date</span>
                                <span className="text-sm">{new Date(clientOrders[0].createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {clientOrders.length > 0 && (
                      <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                          <h3 className="card-title text-lg flex items-center gap-2 mb-4">
                            <TrendingUp size={20} />
                            Order History
                          </h3>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-base-content/60">Total Orders</span>
                              <span className="font-semibold badge badge-primary">{clientOrders.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-base-content/60">Completed</span>
                              <span className="font-semibold text-success">
                                {clientOrders.filter(o => o.status === 'completed').length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-base-content/60">Pending</span>
                              <span className="font-semibold text-warning">
                                {clientOrders.filter(o => o.status === 'pending').length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-base-content/60">Total Spent</span>
                              <span className="font-semibold text-primary">
                                ₱{clientOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-base-300">
                            <p className="text-sm font-semibold mb-2">Recent Orders</p>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {clientOrders.slice(0, 5).map((order) => (
                                <div key={order._id} className="text-xs p-2 bg-base-200 rounded">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-semibold">#{order._id.slice(-6)}</span>
                                    <span className={`badge badge-xs ${
                                      order.status === 'completed' ? 'badge-success' :
                                      order.status === 'pending' ? 'badge-warning' : 'badge-error'
                                    }`}>
                                      {order.status}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-base-content/60">
                                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                    <span>₱{order.totalAmount}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminSupportChat