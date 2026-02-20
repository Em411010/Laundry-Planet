import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { useSocket } from '../contexts/SocketContext'
import { notificationAPI } from '../services/api'

const typeIcon = {
  order_status: '📦',
  new_order: '🛒',
  new_task: '📋',
  staff_assigned: '👤',
  order_cancelled: '❌',
  chat_message: '💬'
}

const formatTime = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

const NotificationBell = () => {
  const { notifications: socketNotifications } = useSocket()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const prevSocketLengthRef = useRef(0)

  // Fetch on mount
  useEffect(() => {
    fetchNotifications()
  }, [])

  // Re-fetch whenever a new socket notification comes in (SocketContext picks it up first)
  useEffect(() => {
    if (socketNotifications.length > prevSocketLengthRef.current) {
      prevSocketLengthRef.current = socketNotifications.length
      fetchNotifications()
    }
  }, [socketNotifications.length])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await notificationAPI.getNotifications()
      if (res.success) {
        setNotifications(res.data)
        setUnreadCount(res.data.filter((n) => !n.isRead).length)
      }
    } catch {
      // Silently fail — user still gets toast notifications via SocketContext
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="btn btn-ghost btn-circle"
        aria-label="Notifications"
      >
        <div className="indicator">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="badge badge-xs badge-error indicator-item font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-base-100 border border-base-300 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-base-200">
            {loading ? (
              <div className="p-8 text-center text-base-content/50 text-sm">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto mb-2 text-base-content/20" />
                <p className="text-sm text-base-content/50">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-base-200 transition-colors ${
                    !notif.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {typeIcon[notif.type] || '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold leading-snug">{notif.title}</p>
                      <p className="text-xs text-base-content/70 mt-0.5 leading-snug">
                        {notif.message}
                      </p>
                      <p className="text-xs text-base-content/40 mt-1">
                        {formatTime(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
