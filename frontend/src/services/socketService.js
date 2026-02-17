import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    // Socket.IO connects to the base URL, not the API path
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const SOCKET_URL = API_URL.replace('/api', ''); // Remove /api for socket connection
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['polling', 'websocket'], // Try polling first, then upgrade
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket disconnected manually');
    }
  }

  // Order-related methods
  joinOrder(orderId) {
    if (this.socket) {
      this.socket.emit('order:join', orderId);
    }
  }

  leaveOrder(orderId) {
    if (this.socket) {
      this.socket.emit('order:leave', orderId);
    }
  }

  onOrderStatusUpdate(callback) {
    if (this.socket) {
      this.socket.on('order:statusUpdate', callback);
    }
  }

  onOrderUpdate(callback) {
    if (this.socket) {
      this.socket.on('order:update', callback);
    }
  }

  onNewOrder(callback) {
    if (this.socket) {
      this.socket.on('order:new', callback);
    }
  }

  onStaffAssigned(callback) {
    if (this.socket) {
      this.socket.on('order:staffAssigned', callback);
    }
  }

  // Staff task notifications
  onNewTask(callback) {
    if (this.socket) {
      this.socket.on('staff:newTask', callback);
    }
  }

  // Chat-related methods
  joinChat(chatId) {
    if (this.socket) {
      this.socket.emit('chat:join', chatId);
    }
  }

  leaveChat(chatId) {
    if (this.socket) {
      this.socket.emit('chat:leave', chatId);
    }
  }

  sendChatMessage(chatId, message) {
    if (this.socket) {
      this.socket.emit('chat:sendMessage', { chatId, message });
    }
  }

  sendTyping(chatId, isTyping) {
    if (this.socket) {
      this.socket.emit('chat:typing', { chatId, isTyping });
    }
  }

  onNewChatMessage(callback) {
    if (this.socket) {
      this.socket.on('chat:newMessage', callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('chat:userTyping', callback);
    }
  }

  // Dashboard-related methods
  joinDashboard() {
    if (this.socket) {
      this.socket.emit('dashboard:join');
    }
  }

  leaveDashboard() {
    if (this.socket) {
      this.socket.emit('dashboard:leave');
    }
  }

  onDashboardOrderUpdate(callback) {
    if (this.socket) {
      this.socket.on('dashboard:orderUpdate', callback);
    }
  }

  onDashboardNewOrder(callback) {
    if (this.socket) {
      this.socket.on('dashboard:newOrder', callback);
    }
  }

  // User presence
  onUserOnline(callback) {
    if (this.socket) {
      this.socket.on('user:online', callback);
    }
  }

  onUserOffline(callback) {
    if (this.socket) {
      this.socket.on('user:offline', callback);
    }
  }

  // Remove specific event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
