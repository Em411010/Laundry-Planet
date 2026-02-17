import Order from '../models/Order.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import AuditLog from '../models/AuditLog.js';
import { calculateShippingFee } from './settingsController.js';
import { emitToUser, emitToRole, emitToOrder, emitToDashboard } from '../socket/socketHandler.js';

// Helper function to log audit
const logAudit = async (action, performedBy, details, req) => {
  try {
    await AuditLog.create({
      action,
      performedBy,
      details,
      ipAddress: req.ip || req.connection.remoteAddress
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

// Create new order (Client only)
export const createOrder = async (req, res) => {
  try {
    console.log('=== CREATE ORDER REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.userId);
    
    const { services, pickupDate, pickupTime, deliverDate, deliverTime, specialInstructions, paymentMethod, customAddress } = req.body;

    // Get user profile
    const user = await User.findById(req.userId);
    console.log('User found:', user ? 'Yes' : 'No');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User profile complete:', user.profileComplete);
    // Check if profile is complete
    if (!user.profileComplete) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile before placing an order'
      });
    }

    // Validate services
    if (!services || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one service'
      });
    }

    // Validate payment method
    if (!['cash', 'gcash'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Only Cash and GCash are accepted.'
      });
    }

    // Prepare service items (quantity will be updated by staff after weighing)
    const orderServices = [];
    let servicesSubtotal = 0;

    for (const item of services) {
      const service = await Service.findById(item.serviceId);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: `Service not found: ${item.serviceId}`
        });
      }

      if (!service.isActive) {
        return res.status(400).json({
          success: false,
          message: `Service "${service.name}" is currently unavailable`
        });
      }

      // Initial quantity is 1, will be updated by staff
      const subtotal = service.price * 1;
      servicesSubtotal += subtotal;

      orderServices.push({
        service: service._id,
        quantity: 1, // Placeholder, will be updated by staff after weighing
        price: service.price,
        subtotal
      });
    }

    // Calculate shipping fee (initial estimate, will be recalculated after weighing)
    const initialWeight = orderServices.length; // Estimate 1kg per service initially
    const shippingFee = await calculateShippingFee(initialWeight);
    const totalAmount = servicesSubtotal + shippingFee;

    // Use custom address if provided, otherwise use profile address
    const pickupAddressData = customAddress || {
      street: user.address.street,
      barangay: user.address.barangay,
      city: user.address.city,
      province: user.address.province,
      zipCode: user.address.zipCode,
      fullAddress: user.address.fullAddress,
      location: user.location
    };

    // Create order
    const order = await Order.create({
      customer: user._id,
      services: orderServices,
      pickupAddress: pickupAddressData,
      contactPhone: user.phone,
      pickupDate,
      pickupTime,
      deliverDate,
      deliverTime,
      specialInstructions,
      paymentMethod,
      servicesSubtotal,
      shippingFee,
      totalAmount, // Initial estimate, will be updated by staff
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date()
      }]
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'firstName lastName email')
      .populate('services.service', 'name category price');

    await logAudit(
      'order_created',
      req.userId,
      `Order created - Total: ₱${totalAmount} - Services: ${services.length}`,
      req
    );

    // Get socket.io instance
    const io = req.app.get('io');

    // Notify all admins and staff about new order
    emitToRole(io, 'admin', 'order:new', {
      orderId: populatedOrder._id,
      orderNumber: populatedOrder.orderNumber,
      customer: `${user.firstName} ${user.lastName}`,
      totalAmount: populatedOrder.totalAmount,
      message: `New order ${populatedOrder.orderNumber} received`
    });

    emitToRole(io, 'staff', 'order:new', {
      orderId: populatedOrder._id,
      orderNumber: populatedOrder.orderNumber,
      customer: `${user.firstName} ${user.lastName}`,
      totalAmount: populatedOrder.totalAmount,
      message: `New order ${populatedOrder.orderNumber} received`
    });

    // Update dashboard
    emitToDashboard(io, 'dashboard:newOrder', {
      orderId: populatedOrder._id,
      orderNumber: populatedOrder.orderNumber,
      totalAmount: populatedOrder.totalAmount
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully. Staff will weigh your laundry during pickup.',
      data: populatedOrder
    });
  } catch (error) {
    console.error('=== ORDER CREATION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// Get all orders (Admin/Staff see all, Client sees own)
export const getAllOrders = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const { status, page = 1, limit = 10, search } = req.query;

    let query = {};

    // Clients can only see their own orders
    if (user.role === 'client') {
      query.customer = req.userId;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search by order number or customer name
    if (search && user.role !== 'client') {
      const customers = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customer: { $in: customers.map(c => c._id) } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate('customer', 'firstName lastName email phone')
      .populate('services.service', 'name category price')
      .populate('assignedStaff.pickup', 'firstName lastName')
      .populate('assignedStaff.processing', 'firstName lastName')
      .populate('assignedStaff.delivery', 'firstName lastName')
      .populate('paymentReceiver', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.userId);

    const order = await Order.findById(id)
      .populate('customer', 'firstName lastName email phone')
      .populate('services.service', 'name category price')
      .populate('assignedStaff.pickup', 'firstName lastName')
      .populate('assignedStaff.processing', 'firstName lastName')
      .populate('assignedStaff.delivery', 'firstName lastName')
      .populate('notes.addedBy', 'firstName lastName')
      .populate('statusHistory.changedBy', 'firstName lastName')
      .populate('paymentReceiver', 'firstName lastName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Clients can only view their own orders
    if (user.role === 'client' && order.customer._id.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// Update order status (Admin/Staff only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    console.log('updateOrderStatus called - ID:', id, 'Status:', status);

    const order = await Order.findById(id)
      .populate('assignedStaff.pickup', 'firstName lastName')
      .populate('assignedStaff.processing', 'firstName lastName')
      .populate('assignedStaff.delivery', 'firstName lastName')
      .populate('paymentReceiver', 'firstName lastName');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get current user info
    const currentUser = await User.findById(req.userId).select('firstName lastName');

    // Validate weight is required when moving from accepted to picked-up
    if (order.status === 'accepted' && status === 'picked-up') {
      if (!order.actualWeight || order.actualWeight <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Please weigh the laundry before marking as picked up'
        });
      }
    }

    // Validate payment is required for cash orders before marking as delivered
    if (status === 'delivered' && order.paymentMethod === 'cash' && order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Please confirm cash payment received before marking as delivered'
      });
    }

    const oldStatus = order.status;
    order.status = status;

    // Add to status history with consistent format
    order.statusHistory.push({
      status,
      updatedBy: req.userId,
      updatedByName: `${currentUser.firstName} ${currentUser.lastName}`,
      updatedAt: new Date()
    });

    if (note) {
      order.notes.push({
        addedBy: req.userId,
        note,
        timestamp: new Date()
      });
    }

    await order.save();

    await logAudit(
      'order_status_updated',
      req.userId,
      `Order status changed from ${oldStatus} to ${status}`,
      req
    );

    console.log('Order saved, fetching updated order...');
    const updatedOrder = await Order.findById(id)
      .populate('customer', 'firstName lastName email')
      .populate('services.service', 'name category price')
      .populate('assignedStaff.pickup', 'firstName lastName')
      .populate('assignedStaff.processing', 'firstName lastName')
      .populate('assignedStaff.delivery', 'firstName lastName')
      .populate('paymentReceiver', 'firstName lastName');

    console.log('Updated order fetched successfully');

    // Get socket.io instance from app
    const io = req.app.get('io');
    
    // Emit order status update to customer
    if (updatedOrder.customer) {
      emitToUser(io, updatedOrder.customer._id.toString(), 'order:statusUpdate', {
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        oldStatus,
        message: `Your order status has been updated to: ${status}`
      });
    }

    // Emit to order-specific room
    emitToOrder(io, updatedOrder._id.toString(), 'order:update', {
      order: updatedOrder,
      status,
      oldStatus
    });

    // Emit dashboard update
    emitToDashboard(io, 'dashboard:orderUpdate', {
      orderId: updatedOrder._id,
      orderNumber: updatedOrder.orderNumber,
      status,
      oldStatus
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// Assign staff to order (Admin only)
export const assignStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const staff = await User.findById(staffId);
    if (!staff || staff.role !== 'staff') {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff member'
      });
    }

    order.assignedStaff = staffId;
    await order.save();

    await logAudit(
      'staff_assigned',
      req.userId,
      `Staff ${staff.firstName} ${staff.lastName} assigned to order`,
      req
    );

    const updatedOrder = await Order.findById(id)
      .populate('customer', 'firstName lastName email')
      .populate('services.service', 'name category price')
      .populate('assignedStaff.pickup', 'firstName lastName')
      .populate('assignedStaff.processing', 'firstName lastName')
      .populate('assignedStaff.delivery', 'firstName lastName')
      .populate('paymentReceiver', 'firstName lastName');

    // Get socket.io instance
    const io = req.app.get('io');

    // Notify assigned staff
    emitToUser(io, staffId, 'staff:newTask', {
      orderId: updatedOrder._id,
      orderNumber: updatedOrder.orderNumber,
      message: `You have been assigned to order ${updatedOrder.orderNumber}`,
      order: updatedOrder
    });

    // Notify customer
    if (updatedOrder.customer) {
      emitToUser(io, updatedOrder.customer._id.toString(), 'order:staffAssigned', {
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        staffName: `${staff.firstName} ${staff.lastName}`,
        message: `A staff member has been assigned to your order`
      });
    }

    // Emit to order room
    emitToOrder(io, updatedOrder._id.toString(), 'order:update', {
      order: updatedOrder
    });

    res.json({
      success: true,
      message: 'Staff assigned successfully',
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning staff',
      error: error.message
    });
  }
};

// Cancel order (Client can cancel own pending orders)
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = await User.findById(req.userId);

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Clients can only cancel their own pending orders
    if (user.role === 'client') {
      if (order.customer.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      if (order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending orders can be cancelled'
        });
      }
    }

    order.status = 'cancelled';
    if (reason) {
      order.notes.push({
        addedBy: req.userId,
        note: `Cancellation reason: ${reason}`,
        timestamp: new Date()
      });
    }
    await order.save();

    console.log(`Order ${order.orderNumber} cancelled by user ${req.userId}. Reason: ${reason || 'No reason provided'}`);

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

// Revive cancelled order (Admin only)
export const reviveOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body;
    const user = await User.findById(req.userId);

    // Only admins can revive orders
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can revive cancelled orders.'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Only cancelled orders can be revived'
      });
    }

    // Set the new status (default to 'pending')
    const statusToSet = newStatus || 'pending';
    order.status = statusToSet;
    
    order.notes.push({
      addedBy: req.userId,
      note: `Order revived from cancelled to ${statusToSet} by admin`,
      timestamp: new Date()
    });

    await order.save();

    await logAudit(
      'order_revived',
      req.userId,
      `Order revived from cancelled to ${statusToSet}`,
      req
    );

    res.json({
      success: true,
      message: 'Order revived successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reviving order',
      error: error.message
    });
  }
};

// Get order statistics (Admin only)
export const getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        byStatus: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics',
      error: error.message
    });
  }
};

// Accept order (Staff)
export const acceptOrder = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Accepting order with ID:', id);

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get current user info
    const currentUser = await User.findById(req.userId).select('firstName lastName');

    // Determine which stage to accept based on current status
    let stage = '';
    let newStatus = '';
    
    if (order.status === 'pending') {
      // First acceptance - Pickup
      if (order.assignedStaff?.pickup) {
        return res.status(400).json({
          success: false,
          message: 'This order already has a pickup staff assigned'
        });
      }
      order.assignedStaff.pickup = req.userId;
      order.status = 'accepted';
      stage = 'pickup';
      newStatus = 'accepted';
      order.statusHistory.push({
        status: 'accepted',
        updatedBy: req.userId,
        updatedByName: `${currentUser.firstName} ${currentUser.lastName}`,
        updatedAt: new Date()
      });
    } else if (order.status === 'picked-up') {
      // Second acceptance - Processing
      if (order.assignedStaff?.processing) {
        return res.status(400).json({
          success: false,
          message: 'This order already has a processing staff assigned'
        });
      }
      order.assignedStaff.processing = req.userId;
      order.status = 'in-progress';
      stage = 'processing';
      newStatus = 'in-progress';
      order.statusHistory.push({
        status: 'in-progress',
        updatedBy: req.userId,
        updatedByName: `${currentUser.firstName} ${currentUser.lastName}`,
        updatedAt: new Date()
      });
    } else if (order.status === 'processed') {
      // Third acceptance - Delivery (after processing staff marks as done)
      if (order.assignedStaff?.delivery) {
        return res.status(400).json({
          success: false,
          message: 'This order already has a delivery staff assigned'
        });
      }
      order.assignedStaff.delivery = req.userId;
      order.status = 'for-delivery';
      stage = 'delivery';
      newStatus = 'for-delivery';
      order.statusHistory.push({
        status: 'for-delivery',
        updatedBy: req.userId,
        updatedByName: `${currentUser.firstName} ${currentUser.lastName}`,
        updatedAt: new Date()
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Cannot accept order in ${order.status} status`
      });
    }

    await order.save();

    await logAudit(
      'order_accepted',
      req.userId,
      `Order accepted for ${stage} - Status: ${newStatus}`,
      req
    );

    res.json({
      success: true,
      message: `Order accepted for ${stage} successfully`,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error accepting order',
      error: error.message
    });
  }
};

// Update order weight (Staff)
export const updateOrderWeight = async (req, res) => {
  try {
    const { id } = req.params;
    const { weight, services } = req.body;
    console.log('Updating weight for order:', id, 'Weight:', weight, 'Services:', services);

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update weight
    order.actualWeight = weight;

    // Update service quantities and recalculate total
    if (services && Array.isArray(services)) {
      let newTotal = 0;
      for (const serviceUpdate of services) {
        const orderService = order.services.find(
          s => s.service.toString() === serviceUpdate.serviceId
        );
        if (orderService) {
          orderService.quantity = serviceUpdate.quantity;
          orderService.subtotal = orderService.price * serviceUpdate.quantity;
          newTotal += orderService.subtotal;
        }
      }
      order.totalAmount = newTotal;
    }

    await order.save();

    await logAudit(
      'order_weight_updated',
      req.userId,
      `Weight updated to ${weight}kg - New total: ₱${order.totalAmount}`,
      req
    );

    res.json({
      success: true,
      message: 'Order weight updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order weight',
      error: error.message
    });
  }
};

// Add image to order (Staff)
export const addOrderImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { url, description } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.images.push({
      url,
      uploadedBy: req.userId,
      description: description || ''
    });

    await order.save();

    await logAudit(
      'order_image_added',
      req.userId,
      `Image uploaded - ${description || 'No description'}`,
      req
    );

    res.json({
      success: true,
      message: 'Image added successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding image',
      error: error.message
    });
  }
};

// Add message to order (Staff/Client)
export const addOrderMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.messages.push({
      sender: req.userId,
      message: message.trim()
    });

    await order.save();

    // Populate sender info for response
    const populatedOrder = await Order.findById(orderId)
      .populate('messages.sender', 'firstName lastName role');

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: populatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// Get staff tasks (their assigned orders)
export const getStaffTasks = async (req, res) => {
  try {
    const staffId = req.userId;
    
    // Find orders where the staff is assigned AND their part is not yet done
    const orders = await Order.find({
      $or: [
        // Pickup staff: show only if status is 'accepted' (not yet picked up)
        { 
          'assignedStaff.pickup': staffId,
          status: 'accepted'
        },
        // Processing staff: show only if status is 'in-progress' (not yet processed)
        { 
          'assignedStaff.processing': staffId,
          status: 'in-progress'
        },
        // Delivery staff: show only if status is 'for-delivery' or 'out-for-delivery' (not yet delivered)
        { 
          'assignedStaff.delivery': staffId,
          status: { $in: ['for-delivery', 'out-for-delivery'] }
        }
      ]
    })
      .populate('customer', 'firstName lastName email phone')
      .populate('services.service', 'name category price unit')
      .populate('assignedStaff.pickup', 'firstName lastName')
      .populate('assignedStaff.processing', 'firstName lastName')
      .populate('assignedStaff.delivery', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching staff tasks',
      error: error.message
    });
  }
};

// Mark payment as received (Delivery Staff)
export const markPaymentReceived = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('assignedStaff.delivery', 'firstName lastName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only delivery staff can mark payment as received
    if (!order.assignedStaff?.delivery || order.assignedStaff.delivery._id.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned delivery staff can confirm payment'
      });
    }

    // Only allow for cash payments
    if (order.paymentMethod !== 'cash') {
      return res.status(400).json({
        success: false,
        message: 'This order does not use cash payment method'
      });
    }


    // Debug: log before updating
    console.log('markPaymentReceived: assignedStaff.delivery:', order.assignedStaff?.delivery);

    // Update payment status and set paymentReceiver
    order.paymentStatus = 'paid';
    order.paymentReceiver = order.assignedStaff.delivery?._id || req.userId;

    // Debug: log paymentReceiver id before save
    console.log('markPaymentReceived: setting paymentReceiver to:', order.paymentReceiver);

    // Add to status history
    order.statusHistory.push({
      status: 'payment-received',
      updatedAt: new Date(),
      updatedBy: order.assignedStaff.delivery._id,
      updatedByName: `${order.assignedStaff.delivery.firstName} ${order.assignedStaff.delivery.lastName}`
    });

    await order.save();

    // Populate the order after saving to get complete data
    await order.populate([
      { path: 'customer', select: 'firstName lastName email' },
      { path: 'services.service' },
      { path: 'assignedStaff.pickup', select: 'firstName lastName' },
      { path: 'assignedStaff.processing', select: 'firstName lastName' },
      { path: 'assignedStaff.delivery', select: 'firstName lastName' },
      { path: 'paymentReceiver', select: 'firstName lastName' }
    ]);

    // Debug: log populated paymentReceiver
    console.log('markPaymentReceived: populated paymentReceiver:', order.paymentReceiver);

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error confirming payment',
      error: error.message
    });
  }
};

// Modify order services (Pickup Staff during accepted status)
export const modifyOrderServices = async (req, res) => {
  try {
    const { id } = req.params;
    const { services } = req.body; // Array of { serviceId, quantity }

    const order = await Order.findById(id)
      .populate('assignedStaff.pickup', 'firstName lastName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only pickup staff can modify services during accepted status
    if (order.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Services can only be modified during pickup (accepted status)'
      });
    }

    if (!order.assignedStaff?.pickup || order.assignedStaff.pickup._id.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned pickup staff can modify services'
      });
    }

    // Validate and fetch service details
    const serviceDetails = await Service.find({
      '_id': { $in: services.map(s => s.serviceId) }
    });

    if (serviceDetails.length !== services.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more services not found'
      });
    }

    // Create new services array with prices and subtotals
    const updatedServices = services.map(s => {
      const serviceDetail = serviceDetails.find(sd => sd._id.toString() === s.serviceId);
      return {
        service: s.serviceId,
        quantity: s.quantity || 0,
        price: serviceDetail.price,
        subtotal: serviceDetail.price * (s.quantity || 0)
      };
    });

    // Update order services
    order.services = updatedServices;

    // Calculate total weight from all services
    order.actualWeight = updatedServices.reduce((sum, s) => sum + s.quantity, 0);

    // Calculate services subtotal
    order.servicesSubtotal = updatedServices.reduce((sum, s) => sum + s.subtotal, 0);

    // Calculate shipping fee based on actual weight
    order.shippingFee = await calculateShippingFee(order.actualWeight);

    // Recalculate total amount (services + shipping)
    order.totalAmount = order.servicesSubtotal + order.shippingFee;

    await order.save();

    // Populate the order after saving
    await order.populate([
      { path: 'customer', select: 'firstName lastName email' },
      { path: 'services.service' },
      { path: 'assignedStaff.pickup', select: 'firstName lastName' },
      { path: 'assignedStaff.processing', select: 'firstName lastName' },
      { path: 'assignedStaff.delivery', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      message: 'Services updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error modifying services',
      error: error.message
    });
  }
};

// Get staff analytics (Staff)
export const getStaffAnalytics = async (req, res) => {
  try {
    const staffId = req.userId;
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Get start of today
    const startOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    
    // Get start of current week (Sunday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get all orders where staff is assigned
    const allOrders = await Order.find({
      $or: [
        { 'assignedStaff.pickup': staffId },
        { 'assignedStaff.processing': staffId },
        { 'assignedStaff.delivery': staffId }
      ]
    }).populate('customer', 'firstName lastName')
      .populate('assignedStaff.pickup', 'firstName lastName')
      .populate('assignedStaff.processing', 'firstName lastName')
      .populate('assignedStaff.delivery', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Get orders for current month
    const monthOrders = await Order.find({
      $or: [
        { 'assignedStaff.pickup': staffId },
        { 'assignedStaff.processing': staffId },
        { 'assignedStaff.delivery': staffId }
      ],
      createdAt: { $gte: firstDayOfMonth }
    });

    // Get today's orders
    const todayOrders = await Order.find({
      $or: [
        { 'assignedStaff.pickup': staffId },
        { 'assignedStaff.processing': staffId },
        { 'assignedStaff.delivery': staffId }
      ],
      createdAt: { $gte: startOfToday }
    });

    // Get pending tasks (only tasks that need their action)
    const pendingTasks = await Order.find({
      $or: [
        // Pickup staff: only if status is 'accepted' (not yet picked up)
        { 
          'assignedStaff.pickup': staffId,
          status: 'accepted'
        },
        // Processing staff: only if status is 'in-progress' (not yet processed)
        { 
          'assignedStaff.processing': staffId,
          status: 'in-progress'
        },
        // Delivery staff: only if status requires delivery
        { 
          'assignedStaff.delivery': staffId,
          status: { $in: ['for-delivery', 'out-for-delivery'] }
        }
      ]
    });

    // Get orders for current week
    const weekOrders = await Order.find({
      $or: [
        { 'assignedStaff.pickup': staffId },
        { 'assignedStaff.processing': staffId },
        { 'assignedStaff.delivery': staffId }
      ],
      createdAt: { $gte: startOfWeek }
    });

    // Calculate overall stats
    const overallStats = {
      pickup: 0,
      processing: 0,
      delivery: 0
    };

    allOrders.forEach(order => {
      if (order.assignedStaff?.pickup?._id?.toString() === staffId.toString() && order.actualWeight) {
        overallStats.pickup += order.actualWeight;
      }
      if (order.assignedStaff?.processing?._id?.toString() === staffId.toString() && order.actualWeight) {
        overallStats.processing += order.actualWeight;
      }
      if (order.assignedStaff?.delivery?._id?.toString() === staffId.toString() && order.actualWeight) {
        overallStats.delivery += order.actualWeight;
      }
    });

    // Calculate monthly stats
    const monthlyStats = {
      pickup: 0,
      processing: 0,
      delivery: 0
    };

    monthOrders.forEach(order => {
      if (order.assignedStaff?.pickup?._id?.toString() === staffId.toString() && order.actualWeight) {
        monthlyStats.pickup += order.actualWeight;
      }
      if (order.assignedStaff?.processing?._id?.toString() === staffId.toString() && order.actualWeight) {
        monthlyStats.processing += order.actualWeight;
      }
      if (order.assignedStaff?.delivery?._id?.toString() === staffId.toString() && order.actualWeight) {
        monthlyStats.delivery += order.actualWeight;
      }
    });

    // Calculate weekly stats (kg per day)
    const weeklyData = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const nextDay = new Date(dayDate);
      nextDay.setDate(dayDate.getDate() + 1);

      let dayKg = 0;
      weekOrders.forEach(order => {
        if (order.createdAt >= dayDate && order.createdAt < nextDay && order.actualWeight) {
          if (order.assignedStaff?.pickup?.toString() === staffId.toString() ||
              order.assignedStaff?.processing?.toString() === staffId.toString() ||
              order.assignedStaff?.delivery?.toString() === staffId.toString()) {
            dayKg += order.actualWeight;
          }
        }
      });

      weeklyData.push({
        day: daysOfWeek[i],
        kg: dayKg,
        date: dayDate.toLocaleDateString()
      });
    }

    // Get recent activity (last 10 orders)
    const recentActivity = allOrders.slice(0, 10).map(order => ({
      orderId: order.orderNumber,
      customer: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Unknown',
      status: order.status,
      actualWeight: order.actualWeight || 0,
      role: order.assignedStaff?.pickup?._id?.toString() === staffId.toString() ? 'Pickup' :
            order.assignedStaff?.processing?._id?.toString() === staffId.toString() ? 'Processing' :
            order.assignedStaff?.delivery?._id?.toString() === staffId.toString() ? 'Delivery' : 'Staff',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    res.json({
      success: true,
      data: {
        overall: overallStats,
        monthly: monthlyStats,
        month: currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        orderCounts: {
          allTime: allOrders.length,
          thisMonth: monthOrders.length,
          today: todayOrders.length,
          pending: pendingTasks.length
        },
        weeklyData,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching staff analytics',
      error: error.message
    });
  }
};

// Create walk-in order (Staff only)
export const createWalkInOrder = async (req, res) => {
  try {
    const { 
      customerId, 
      customerInfo,
      services, 
      pickupDate, 
      pickupTime, 
      deliverDate, 
      deliverTime, 
      specialInstructions, 
      paymentMethod,
      paymentStatus,
      pickupAddress,
      contactPhone,
      isGuest
    } = req.body;

    // Validate services
    if (!services || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one service'
      });
    }

    // Validate payment method
    if (!['cash', 'gcash', 'card'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    let customer = null;
    let customerDetails = {};

    // Handle customer (existing or guest)
    if (customerId && !isGuest) {
      customer = await User.findById(customerId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }
      customerDetails = {
        customer: customer._id,
        contactPhone: contactPhone || customer.phone,
        pickupAddress: pickupAddress || {
          street: customer.address?.street || '',
          barangay: customer.address?.barangay || '',
          city: customer.address?.city || 'Walk-in',
          province: customer.address?.province || '',
          zipCode: customer.address?.zipCode || '',
          fullAddress: customer.address?.fullAddress || 'Walk-in Customer',
          location: customer.location || { type: 'Point', coordinates: [0, 0] }
        }
      };
    } else if (isGuest && customerInfo) {
      // Guest customer - store info but no user reference
      customerDetails = {
        guestCustomer: {
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          phone: customerInfo.phone,
          email: customerInfo.email
        },
        contactPhone: customerInfo.phone,
        pickupAddress: pickupAddress || {
          fullAddress: 'Walk-in Customer',
          city: 'Walk-in',
          location: { type: 'Point', coordinates: [0, 0] }
        }
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Customer information is required'
      });
    }

    // Process services with exact quantities and prices
    const orderServices = [];
    let servicesSubtotal = 0;
    let totalWeight = 0;

    for (const item of services) {
      const service = await Service.findById(item.serviceId);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: `Service not found: ${item.serviceId}`
        });
      }

      if (!service.isActive) {
        return res.status(400).json({
          success: false,
          message: `Service "${service.name}" is currently unavailable`
        });
      }

      const quantity = item.quantity || 1;
      const subtotal = service.price * quantity;
      servicesSubtotal += subtotal;
      totalWeight += quantity; // Assuming quantity is in kg

      orderServices.push({
        service: service._id,
        quantity,
        price: service.price,
        subtotal
      });
    }

    // Calculate shipping fee based on total weight
    const shippingFee = await calculateShippingFee(totalWeight);
    const totalAmount = servicesSubtotal + shippingFee;

    // Create order
    const orderData = {
      ...customerDetails,
      services: orderServices,
      pickupDate: pickupDate || new Date(),
      pickupTime: pickupTime || 'Immediate',
      deliverDate,
      deliverTime,
      specialInstructions,
      paymentMethod,
      paymentStatus: paymentStatus || 'pending',
      servicesSubtotal,
      shippingFee,
      totalAmount,
      actualWeight: totalWeight,
      status: 'pending',
      isWalkIn: true,
      createdBy: req.userId, // Staff who created the order
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        updatedBy: req.userId
      }]
    };

    const order = await Order.create(orderData);

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'firstName lastName email phone')
      .populate('services.service', 'name category price')
      .populate('createdBy', 'firstName lastName email');

    await logAudit(
      'walk_in_order_created',
      req.userId,
      `Walk-in order created - Total: ₱${totalAmount} - ${isGuest ? 'Guest' : 'Member'}`,
      req
    );

    res.status(201).json({
      success: true,
      message: 'Walk-in order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    console.error('Walk-in order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating walk-in order',
      error: error.message
    });
  }
};
