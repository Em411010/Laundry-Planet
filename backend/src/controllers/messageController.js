import Message from '../models/Message.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { emitToUser, emitToRole } from '../socket/socketHandler.js';

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { orderId, content } = req.body;
    const userId = req.userId;

    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized (customer or assigned staff)
    const isCustomer = order.customer.toString() === userId.toString();
    const isStaff = req.userRole === 'staff';
    const isAssignedStaff = 
      order.assignedStaff?.pickup?._id?.toString() === userId.toString() ||
      order.assignedStaff?.processing?._id?.toString() === userId.toString() ||
      order.assignedStaff?.delivery?._id?.toString() === userId.toString();

    if (!isCustomer && !isStaff) {
      return res.status(403).json({ message: 'Not authorized to message on this order' });
    }

    // Determine sender role
    const senderRole = isCustomer ? 'client' : 'staff';

    // Create message
    const message = await Message.create({
      type: 'order',
      order: orderId,
      sender: userId,
      senderRole,
      content
    });

    // Populate sender info
    await message.populate('sender', 'firstName lastName');

    // Emit real-time + save notification for the other party
    const io = req.app.get('io');
    const senderName = `${message.sender.firstName} ${message.sender.lastName}`;
    const populatedOrder = await Order.findById(orderId)
      .populate('customer', '_id firstName lastName')
      .populate('assignedStaff.pickup', '_id firstName lastName')
      .populate('assignedStaff.processing', '_id firstName lastName')
      .populate('assignedStaff.delivery', '_id firstName lastName');

    const chatPayload = {
      orderId,
      orderNumber: populatedOrder.orderNumber,
      sender: senderName,
      senderRole,
      message: content
    };

    if (senderRole === 'client') {
      // Notify all assigned staff
      const staffIds = [
        populatedOrder.assignedStaff?.pickup?._id,
        populatedOrder.assignedStaff?.processing?._id,
        populatedOrder.assignedStaff?.delivery?._id
      ].filter(Boolean);
      for (const sid of staffIds) {
        const sidStr = sid.toString();
        if (sidStr !== userId.toString()) {
          emitToUser(io, sidStr, 'chat:newMessage', chatPayload);
          await Notification.create({
            recipient: sid,
            type: 'chat_message',
            title: 'New Message',
            message: `${senderName}: ${content.substring(0, 80)}`,
            orderId,
            orderNumber: populatedOrder.orderNumber
          });
        }
      }
      // Also notify all admins
      emitToRole(io, 'admin', 'chat:newMessage', chatPayload);
    } else {
      // Staff sent → notify the client
      if (populatedOrder.customer) {
        const custId = populatedOrder.customer._id;
        emitToUser(io, custId.toString(), 'chat:newMessage', chatPayload);
        await Notification.create({
          recipient: custId,
          type: 'chat_message',
          title: 'New Message from Staff',
          message: `${senderName}: ${content.substring(0, 80)}`,
          orderId,
          orderNumber: populatedOrder.orderNumber
        });
      }
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

// Get messages for an order
export const getOrderMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    // Verify order exists
    const order = await Order.findById(orderId).populate('assignedStaff.pickup assignedStaff.processing assignedStaff.delivery');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized
    const isCustomer = order.customer.toString() === userId.toString();
    const isStaff = req.userRole === 'staff';
    const isAssignedStaff = 
      order.assignedStaff?.pickup?._id?.toString() === userId.toString() ||
      order.assignedStaff?.processing?._id?.toString() === userId.toString() ||
      order.assignedStaff?.delivery?._id?.toString() === userId.toString();

    if (!isCustomer && !isStaff) {
      return res.status(403).json({ message: 'Not authorized to view messages for this order' });
    }

    // Get messages
    const messages = await Message.find({ order: orderId })
      .populate('sender', 'firstName lastName')
      .sort({ createdAt: 1 });

    // Mark messages as read for the current user
    await Message.updateMany(
      { 
        order: orderId, 
        sender: { $ne: userId },
        read: false 
      },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
  }
};

// Get unread message count for user
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    // Get all orders where user is customer or assigned staff
    const customerOrders = await Order.find({ customer: userId }).select('_id');
    const staffOrders = await Order.find({
      $or: [
        { 'assignedStaff.pickup': userId },
        { 'assignedStaff.processing': userId },
        { 'assignedStaff.delivery': userId }
      ]
    }).select('_id');

    const orderIds = [
      ...customerOrders.map(o => o._id),
      ...staffOrders.map(o => o._id)
    ];

    // Count unread messages not sent by user
    const unreadCount = await Message.countDocuments({
      order: { $in: orderIds },
      sender: { $ne: userId },
      read: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to get unread count', error: error.message });
  }
};

// Send support message (for customer-admin communication)
export const sendSupportMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.userId;
    const userRole = req.userRole;

    // Only customers and admins can send support messages
    if (userRole !== 'client' && userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to send support messages' });
    }

    // Create support message
    const message = await Message.create({
      type: 'support',
      sender: userId,
      senderRole: userRole,
      content
    });

    // Populate sender info
    await message.populate('sender', 'firstName lastName');

    // Emit real-time + save notification
    const io = req.app.get('io');
    const senderName = `${message.sender.firstName} ${message.sender.lastName}`;
    const notifMsg = `${senderName}: ${content.substring(0, 80)}`;

    if (userRole === 'client') {
      // Client → notify all admins
      emitToRole(io, 'admin', 'chat:newMessage', { sender: senderName, senderRole: 'client', message: content });
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
      await Notification.insertMany(admins.map(a => ({
        recipient: a._id,
        type: 'chat_message',
        title: 'New Support Message',
        message: notifMsg
      })));
    } else {
      // Admin → notify the client who sent the last support message (or all clients with open support)
      // Emit to the 'client' room so any online client gets the update
      emitToRole(io, 'client', 'chat:newMessage', { sender: senderName, senderRole: 'admin', message: content });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Send support message error:', error);
    res.status(500).json({ message: 'Failed to send support message', error: error.message });
  }
};

// Get support messages (for customer-admin communication)
export const getSupportMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    console.log('Backend: Getting support messages for user:', { userId, userRole });

    // Only customers and admins can view support messages
    if (userRole !== 'client' && userRole !== 'admin') {
      console.log('Backend: Access denied for role:', userRole);
      return res.status(403).json({ message: 'Not authorized to view support messages' });
    }

    // Get all support messages
    const messages = await Message.find({ type: 'support' })
      .populate('sender', 'firstName lastName')
      .sort({ createdAt: 1 });

    console.log('Backend: Found support messages:', messages.length);

    // Mark messages as read for the current user (messages not sent by them)
    await Message.updateMany(
      {
        type: 'support',
        sender: { $ne: userId },
        read: false
      },
      { read: true }
    );

    console.log('Backend: Sending response with', messages.length, 'messages');

    res.json(messages);
  } catch (error) {
    console.error('Backend: Get support messages error:', error);
    res.status(500).json({ message: 'Failed to get support messages', error: error.message });
  }
};
