import Message from '../models/Message.js';
import Order from '../models/Order.js';

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
    const senderRole = isCustomer ? 'customer' : 'staff';

    // Create message
    const message = await Message.create({
      order: orderId,
      sender: userId,
      senderRole,
      content
    });

    // Populate sender info
    await message.populate('sender', 'firstName lastName');

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
