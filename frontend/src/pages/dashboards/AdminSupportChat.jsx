import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, MessageSquare, Loader, Users, ArrowLeft, Clock } from 'lucide-react'
import { messageAPI } from '../../services/api'
import { AdminSidebar, AdminNavbar } from '../../components/navbars/AdminNavbar'

const AdminSupportChat = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'conversation'
  const [selectedClient, setSelectedClient] = useState(null)

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
      loadSupportMessages()
    }
  }, [user])

  const loadSupportMessages = async () => {
    try {
      setIsLoading(true)
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

      <div className="lg:ml-64 pt-20 p-4 md:p-8 mt-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="text-primary" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {viewMode === 'conversation' ? `${selectedClient?.client?.firstName} ${selectedClient?.client?.lastName}` : 'Customer Support'}
                </h1>
                <p className="text-base-content/60">
                  {viewMode === 'conversation' ? 'Chat with this customer' : 'Chat with customers and handle support requests'}
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

          {/* Content */}
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
          ) : (
            /* Chat Container - Conversation View */
            <div className="card bg-base-100 shadow-lg h-[600px] flex flex-col">
              {/* Messages Area */}
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

              {/* Input Area */}
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
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminSupportChat