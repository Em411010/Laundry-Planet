import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, MessageSquare, Loader } from 'lucide-react'
import { messageAPI } from '../../services/api'
import { ClientSidebar, ClientNavbar } from '../../components/navbars/ClientNavbar'

const ClientSupportChat = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)

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
      const response = await messageAPI.getSupportMessages()
      setMessages(response || [])
    } catch (error) {
      console.error('Error loading support messages:', error)
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    try {
      setIsSending(true)
      const response = await messageAPI.sendSupportMessage(inputValue)
      
      // Add message to UI
      const newMessage = {
        _id: response._id || response.id || Date.now().toString(),
        sender: user,
        senderRole: 'client',
        content: inputValue,
        createdAt: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, newMessage])
      setInputValue('')
    } catch (error) {
      console.error('Error sending message:', error)
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
      <ClientSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <ClientNavbar toggleSidebar={toggleSidebar} />
      
      <div className="lg:ml-64 p-4 md:p-6 mt-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-primary/10">
                <MessageSquare className="text-primary" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Support Chat</h1>
                <p className="text-base-content/60">Chat directly with our admin team</p>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg h-[600px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 border-b border-base-300">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader className="animate-spin mx-auto mb-2 text-primary" size={32} />
                    <p className="text-base-content/60">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="mx-auto mb-3 text-base-content/40" size={40} />
                    <p className="text-base-content/60">No messages yet. Start a conversation!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isCustomer = msg.senderRole === 'client'
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isCustomer
                              ? 'bg-primary text-primary-content'
                              : 'bg-base-200 text-base-content'
                          }`}
                        >
                          {!isCustomer && (
                            <p className="text-xs font-semibold opacity-75 mb-1">
                              {msg.sender?.firstName || 'Support'}
                            </p>
                          )}
                          <p className="text-sm break-words">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isCustomer ? 'opacity-75' : 'opacity-60'
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
                  placeholder="Type your message here... (Shift+Enter for new line)"
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
      </div>
    </div>
  )
}

export default ClientSupportChat
