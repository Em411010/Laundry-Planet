import { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../services/socketService';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Connect socket when component mounts if user is logged in
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const socket = socketService.connect(token);

      // Setup connection listeners
      socket.on('connect', () => {
        setIsConnected(true);
      });

      socket.on('disconnect', (reason) => {
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        setIsConnected(false);
      });

      // Setup global notification listeners
      setupNotificationListeners();
    } catch (error) {
      // Socket initialization failed
    }

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  const setupNotificationListeners = () => {
    // Order status updates
    socketService.onOrderStatusUpdate((data) => {
      addNotification({
        type: 'order',
        title: 'Order Update',
        message: data.message,
        data
      });
      
      toast.success(data.message, {
        duration: 4000,
        icon: '📦'
      });
    });

    // New orders (for admin/staff)
    socketService.onNewOrder((data) => {
      addNotification({
        type: 'order',
        title: 'New Order',
        message: data.message,
        data
      });

      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'admin' || user.role === 'staff') {
          toast('New order received!', {
            duration: 5000,
            icon: '🔔'
          });
        }
      }
    });

    // Staff task notifications
    socketService.onNewTask((data) => {
      addNotification({
        type: 'task',
        title: 'New Task',
        message: data.message,
        data
      });

      toast(data.message, {
        duration: 5000,
        icon: '📋'
      });
    });

    // Staff assignment notifications
    socketService.onStaffAssigned((data) => {
      addNotification({
        type: 'order',
        title: 'Staff Assigned',
        message: data.message,
        data
      });

      toast.success(data.message, {
        duration: 4000,
        icon: '👤'
      });
    });
  };

  const addNotification = (notification) => {
    setNotifications(prev => [
      {
        ...notification,
        id: Date.now(),
        timestamp: new Date(),
        read: false
      },
      ...prev
    ].slice(0, 50)); // Keep only last 50 notifications
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    socket: socketService,
    isConnected,
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    addNotification,
    markNotificationAsRead,
    markAllAsRead,
    clearNotifications
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
