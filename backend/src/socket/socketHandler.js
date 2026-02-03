import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Store connected users
const connectedUsers = new Map();

// Socket.IO authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.userRole = user.role;
    socket.userData = user;
    socket.isAuthenticated = true;
    
    next();
  } catch (error) {
    return next(new Error('Invalid token'));
  }
};

export const setupSocketIO = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const userRole = socket.userRole;
    
    // Store user connection
    connectedUsers.set(userId, {
      socketId: socket.id,
      role: userRole,
      userData: socket.userData
    });

    // Join user to their personal room
    socket.join(userId);
    
    // Join role-based rooms
    socket.join(userRole); // 'admin', 'staff', or 'client'
    
    // Notify admins about new connection
    if (userRole !== 'admin') {
      io.to('admin').emit('user:online', {
        userId,
        role: userRole,
        name: `${socket.userData.firstName} ${socket.userData.lastName}`
      });
    }

    // Handle joining order-specific room
    socket.on('order:join', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`User ${userId} joined order room: ${orderId}`);
    });

    // Handle leaving order room
    socket.on('order:leave', (orderId) => {
      socket.leave(`order:${orderId}`);
      console.log(`User ${userId} left order room: ${orderId}`);
    });

    // Handle joining chat room
    socket.on('chat:join', (chatId) => {
      socket.join(`chat:${chatId}`);
      console.log(`User ${userId} joined chat room: ${chatId}`);
    });

    // Handle leaving chat room
    socket.on('chat:leave', (chatId) => {
      socket.leave(`chat:${chatId}`);
      console.log(`User ${userId} left chat room: ${chatId}`);
    });

    // Handle typing indicator for chat
    socket.on('chat:typing', ({ chatId, isTyping }) => {
      socket.to(`chat:${chatId}`).emit('chat:userTyping', {
        userId,
        name: `${socket.userData.firstName} ${socket.userData.lastName}`,
        isTyping
      });
    });

    // Handle chat message (real-time)
    socket.on('chat:sendMessage', async ({ chatId, message }) => {
      try {
        // Message will be saved by messageController, just broadcast it
        io.to(`chat:${chatId}`).emit('chat:newMessage', {
          chatId,
          message: {
            sender: userId,
            senderName: `${socket.userData.firstName} ${socket.userData.lastName}`,
            message,
            timestamp: new Date()
          }
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle dashboard join (for live updates)
    socket.on('dashboard:join', () => {
      socket.join('dashboard');
    });

    // Handle dashboard leave
    socket.on('dashboard:leave', () => {
      socket.leave('dashboard');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      
      // Notify admins about disconnection
      if (userRole !== 'admin') {
        io.to('admin').emit('user:offline', {
          userId,
          role: userRole,
          name: `${socket.userData.firstName} ${socket.userData.lastName}`
        });
      }
    });
  });

  return io;
};

// Helper function to emit events from controllers
export const emitToUser = (io, userId, event, data) => {
  io.to(userId).emit(event, data);
};

export const emitToRole = (io, role, event, data) => {
  io.to(role).emit(event, data);
};

export const emitToOrder = (io, orderId, event, data) => {
  io.to(`order:${orderId}`).emit(event, data);
};

export const emitToChat = (io, chatId, event, data) => {
  io.to(`chat:${chatId}`).emit(event, data);
};

export const emitToDashboard = (io, event, data) => {
  io.to('dashboard').emit(event, data);
};

export const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};

export const getOnlineUsers = () => {
  return Array.from(connectedUsers.entries()).map(([userId, data]) => ({
    userId,
    ...data
  }));
};
