import Order from '../models/Order.js';
import AuditLog from '../models/AuditLog.js';
import paymongoService from '../services/paymongoService.js';

// Helper function to log audit
const logAudit = async (action, performedBy, details, req) => {
  try {
    await AuditLog.create({
      action,
      performedBy,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress || 'webhook'
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

/**
 * Initiate GCash payment for an order
 * Creates a PayMongo source and returns checkout URL
 */
export const initiateGCashPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user (for clients) or user is staff/admin
    const user = req.user;
    if (user.role === 'client' && order.customer?._id?.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    // Check minimum amount (₱100)
    if (order.totalAmount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum payment amount for GCash is ₱100'
      });
    }

    // Build success and failed URLs
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const successUrl = `${frontendUrl}/payment/success?orderId=${order._id}`;
    const failedUrl = `${frontendUrl}/payment/failed?orderId=${order._id}`;

    // Get customer details
    const customer = order.customer || {
      firstName: order.guestCustomer?.firstName || 'Guest',
      lastName: order.guestCustomer?.lastName || 'Customer',
      email: order.guestCustomer?.email || 'guest@laundryplanet.com',
      phone: order.contactPhone
    };

    // Create GCash source
    const source = await paymongoService.createGCashSource(
      order.totalAmount,
      order._id.toString(),
      customer,
      successUrl,
      failedUrl
    );

    // Update order with payment source details
    order.paymentMethod = 'gcash';
    order.paymentDetails = {
      ...order.paymentDetails,
      paymongoSourceId: source.id,
      checkoutUrl: source.attributes.redirect.checkout_url
    };
    await order.save();

    await logAudit(
      'gcash_payment_initiated',
      req.userId,
      `GCash payment initiated for order ${order.orderNumber} - Amount: ₱${order.totalAmount}`,
      req
    );

    res.json({
      success: true,
      message: 'GCash payment initiated',
      data: {
        checkoutUrl: source.attributes.redirect.checkout_url,
        sourceId: source.id,
        orderId: order._id
      }
    });
  } catch (error) {
    console.error('Initiate GCash payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate GCash payment'
    });
  }
};

/**
 * Handle payment success callback
 * Client is redirected here after successful GCash authorization
 */
export const handlePaymentSuccess = async (req, res) => {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // If already paid, just return success
    if (order.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Payment already confirmed',
        data: { order }
      });
    }

    // Check the source status
    if (order.paymentDetails?.paymongoSourceId) {
      const source = await paymongoService.getSource(order.paymentDetails.paymongoSourceId);
      
      if (source.attributes.status === 'chargeable') {
        // Create the payment
        const payment = await paymongoService.createPayment(
          source.id,
          order.totalAmount,
          `Payment for Order ${order.orderNumber}`
        );

        // Update order
        order.paymentStatus = 'paid';
        order.paymentDetails.paymongoPaymentId = payment.id;
        order.paymentDetails.paidAt = new Date();
        order.paymentDetails.gcashReferenceNumber = payment.attributes.external_reference_number || payment.id;
        await order.save();

        await logAudit(
          'gcash_payment_completed',
          order.customer?._id || order.createdBy,
          `GCash payment completed for order ${order.orderNumber} - Amount: ₱${order.totalAmount}`,
          req
        );

        return res.json({
          success: true,
          message: 'Payment successful',
          data: { order }
        });
      } else if (source.attributes.status === 'paid') {
        // Already processed
        order.paymentStatus = 'paid';
        order.paymentDetails.paidAt = new Date();
        await order.save();

        return res.json({
          success: true,
          message: 'Payment confirmed',
          data: { order }
        });
      }
    }

    // Payment pending webhook confirmation
    res.json({
      success: true,
      message: 'Payment is being processed',
      data: { 
        order,
        status: 'processing'
      }
    });
  } catch (error) {
    console.error('Handle payment success error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
};

/**
 * Handle payment failed callback
 */
export const handlePaymentFailed = async (req, res) => {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order payment details
    order.paymentDetails.failedAt = new Date();
    order.paymentDetails.failureReason = 'Payment was cancelled or failed';
    await order.save();

    await logAudit(
      'gcash_payment_failed',
      order.customer?._id || order.createdBy,
      `GCash payment failed/cancelled for order ${order.orderNumber}`,
      req
    );

    res.json({
      success: true,
      message: 'Payment was not completed',
      data: { order }
    });
  } catch (error) {
    console.error('Handle payment failed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment failure'
    });
  }
};

/**
 * Get payment status for an order
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('customer', 'firstName lastName email')
      .select('orderNumber paymentStatus paymentMethod paymentDetails totalAmount');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        paidAt: order.paymentDetails?.paidAt,
        gcashReferenceNumber: order.paymentDetails?.gcashReferenceNumber
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment status'
    });
  }
};

/**
 * PayMongo Webhook Handler
 * Receives events from PayMongo for payment status updates
 */
export const handlePayMongoWebhook = async (req, res) => {
  try {
    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['paymongo-signature'];

    // Verify webhook signature (skip in development if not configured)
    if (process.env.PAYMONGO_WEBHOOK_SECRET) {
      const isValid = paymongoService.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = req.body;
    const eventType = event.data?.attributes?.type;
    const eventData = event.data?.attributes?.data;

    console.log('PayMongo webhook received:', eventType);

    switch (eventType) {
      case 'source.chargeable': {
        // Source is ready to be charged
        const sourceId = eventData.id;
        const orderId = eventData.attributes?.metadata?.orderId;

        if (orderId) {
          const order = await Order.findById(orderId);
          if (order && order.paymentStatus !== 'paid') {
            try {
              // Create payment from source
              const payment = await paymongoService.createPayment(
                sourceId,
                order.totalAmount,
                `Payment for Order ${order.orderNumber}`
              );

              order.paymentStatus = 'paid';
              order.paymentDetails.paymongoPaymentId = payment.id;
              order.paymentDetails.paidAt = new Date();
              order.paymentDetails.gcashReferenceNumber = 
                payment.attributes.external_reference_number || payment.id;
              await order.save();

              await logAudit(
                'gcash_payment_webhook_completed',
                order.customer || order.createdBy,
                `GCash payment confirmed via webhook for order ${order.orderNumber}`,
                { ip: 'webhook' }
              );

              console.log(`Payment completed for order ${order.orderNumber}`);
            } catch (paymentError) {
              console.error('Failed to create payment from webhook:', paymentError);
            }
          }
        }
        break;
      }

      case 'payment.paid': {
        // Payment was successful
        const paymentId = eventData.id;
        
        // Find order by payment ID
        const order = await Order.findOne({
          'paymentDetails.paymongoPaymentId': paymentId
        });

        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          order.paymentDetails.paidAt = new Date();
          await order.save();

          console.log(`Payment confirmed for order ${order.orderNumber}`);
        }
        break;
      }

      case 'payment.failed': {
        // Payment failed
        const sourceId = eventData.attributes?.source?.id;
        
        const order = await Order.findOne({
          'paymentDetails.paymongoSourceId': sourceId
        });

        if (order) {
          order.paymentDetails.failedAt = new Date();
          order.paymentDetails.failureReason = 
            eventData.attributes?.last_payment_error?.message || 'Payment failed';
          await order.save();

          await logAudit(
            'gcash_payment_webhook_failed',
            order.customer || order.createdBy,
            `GCash payment failed via webhook for order ${order.orderNumber}`,
            { ip: 'webhook' }
          );

          console.log(`Payment failed for order ${order.orderNumber}`);
        }
        break;
      }

      default:
        console.log('Unhandled webhook event type:', eventType);
    }

    // Always respond 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    // Still respond 200 to prevent retries for processing errors
    res.status(200).json({ received: true, error: 'Processing error' });
  }
};

/**
 * Retry payment for an order with failed payment
 */
export const retryPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    // Reset payment details and create new source
    order.paymentDetails = {
      paymongoSourceId: null,
      paymongoPaymentId: null,
      checkoutUrl: null,
      gcashReferenceNumber: null,
      paidAt: null,
      failedAt: null,
      failureReason: null
    };
    await order.save();

    // Build URLs
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const successUrl = `${frontendUrl}/payment/success?orderId=${order._id}`;
    const failedUrl = `${frontendUrl}/payment/failed?orderId=${order._id}`;

    const customer = order.customer || {
      firstName: order.guestCustomer?.firstName || 'Guest',
      lastName: order.guestCustomer?.lastName || 'Customer',
      email: order.guestCustomer?.email || 'guest@laundryplanet.com',
      phone: order.contactPhone
    };

    // Create new GCash source
    const source = await paymongoService.createGCashSource(
      order.totalAmount,
      order._id.toString(),
      customer,
      successUrl,
      failedUrl
    );

    order.paymentDetails.paymongoSourceId = source.id;
    order.paymentDetails.checkoutUrl = source.attributes.redirect.checkout_url;
    await order.save();

    await logAudit(
      'gcash_payment_retry',
      req.userId,
      `GCash payment retry initiated for order ${order.orderNumber}`,
      req
    );

    res.json({
      success: true,
      message: 'Payment retry initiated',
      data: {
        checkoutUrl: source.attributes.redirect.checkout_url,
        orderId: order._id
      }
    });
  } catch (error) {
    console.error('Retry payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retry payment'
    });
  }
};
