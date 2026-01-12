import Order from '../models/Order.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import AuditLog from '../models/AuditLog.js';

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
    
    const { services, pickupDate, pickupTime, specialInstructions, paymentMethod, customAddress } = req.body;

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
    let totalAmount = 0;

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
      totalAmount += subtotal;

      orderServices.push({
        service: service._id,
        quantity: 1, // Placeholder, will be updated by staff after weighing
        price: service.price,
        subtotal
      });
    }

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
      specialInstructions,
      paymentMethod,
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

    // await logAudit(
    //   'order_created',
    //   req.userId,
    //   `Order ${order.orderNumber} created - Services: ${services.length}`,
    //   req
    // );

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
      .populate('statusHistory.changedBy', 'firstName lastName');

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
      .populate('assignedStaff.delivery', 'firstName lastName');
    
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

    // await logAudit(
    //   'order_updated',
    //   req.userId,
    //   `Order ${order.orderNumber} status changed from ${oldStatus} to ${status}`,
    //   req
    // );

    console.log('Order saved, fetching updated order...');
    const updatedOrder = await Order.findById(id)
      .populate('customer', 'firstName lastName email')
      .populate('services.service', 'name category price')
      .populate('assignedStaff.pickup', 'firstName lastName')
      .populate('assignedStaff.processing', 'firstName lastName')
      .populate('assignedStaff.delivery', 'firstName lastName');

    console.log('Updated order fetched successfully');

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

    // await logAudit(
    //   'order_updated',
    //   req.userId,
    //   `Staff ${staff.firstName} ${staff.lastName} assigned to order ${order.orderNumber}`,
    //   req
    // );

    const updatedOrder = await Order.findById(id)
      .populate('customer', 'firstName lastName email')
      .populate('services.service', 'name category price')
      .populate('assignedStaff.pickup', 'firstName lastName')
      .populate('assignedStaff.processing', 'firstName lastName')
      .populate('assignedStaff.delivery', 'firstName lastName');

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
      if (order.customer.toString() !== req.userId) {
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

    // await logAudit(
    //   'order_cancelled',
    //   req.userId,
    //   `Order ${order.orderNumber} cancelled`,
    //   req
    // );

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

    // await logAudit('ORDER_ACCEPTED', req.userId, {
    //   orderId: order._id,
    //   orderNumber: order.orderNumber,
    //   stage,
    //   newStatus
    // }, req);

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

    // await logAudit('ORDER_WEIGHT_UPDATED', req.userId, {
    //   orderId: order._id,
    //   orderNumber: order.orderNumber,
    //   weight,
    //   newTotal: order.totalAmount
    // }, req);

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

    // await logAudit('ORDER_IMAGE_ADDED', req.userId, {
    //   orderId: order._id,
    //   orderNumber: order.orderNumber
    // }, req);

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
    // Find orders where the staff is assigned to any stage (pickup, processing, or delivery)
    const orders = await Order.find({
      $or: [
        { 'assignedStaff.pickup': req.userId },
        { 'assignedStaff.processing': req.userId },
        { 'assignedStaff.delivery': req.userId }
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

    // Update payment status
    order.paymentStatus = 'paid';

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
      { path: 'assignedStaff.delivery', select: 'firstName lastName' }
    ]);

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
