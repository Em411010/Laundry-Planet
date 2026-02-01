import axios from 'axios';
import crypto from 'crypto';

const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';

// Get the base64 encoded secret key for auth
const getAuthHeader = () => {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    throw new Error('PAYMONGO_SECRET_KEY is not configured');
  }
  return 'Basic ' + Buffer.from(secretKey + ':').toString('base64');
};

/**
 * Create a GCash payment source
 * @param {number} amount - Amount in PHP (will be converted to centavos)
 * @param {string} orderId - Order ID for reference
 * @param {object} customer - Customer details
 * @param {string} successUrl - Redirect URL on success
 * @param {string} failedUrl - Redirect URL on failure
 */
export const createGCashSource = async (amount, orderId, customer, successUrl, failedUrl) => {
  try {
    const amountInCentavos = Math.round(amount * 100);
    
    // Minimum amount is 100 PHP (10000 centavos)
    if (amountInCentavos < 10000) {
      throw new Error('Minimum payment amount is ₱100');
    }

    const response = await axios.post(
      `${PAYMONGO_API_URL}/sources`,
      {
        data: {
          attributes: {
            amount: amountInCentavos,
            currency: 'PHP',
            type: 'gcash',
            redirect: {
              success: successUrl,
              failed: failedUrl
            },
            billing: {
              name: `${customer.firstName} ${customer.lastName}`,
              email: customer.email,
              phone: customer.phone || ''
            },
            metadata: {
              orderId: orderId
            }
          }
        }
      },
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('PayMongo createGCashSource error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errors?.[0]?.detail || 'Failed to create GCash payment');
  }
};

/**
 * Create a payment from a chargeable source
 * @param {string} sourceId - The source ID
 * @param {number} amount - Amount in PHP
 * @param {string} description - Payment description
 */
export const createPayment = async (sourceId, amount, description) => {
  try {
    const amountInCentavos = Math.round(amount * 100);

    const response = await axios.post(
      `${PAYMONGO_API_URL}/payments`,
      {
        data: {
          attributes: {
            amount: amountInCentavos,
            currency: 'PHP',
            description: description,
            source: {
              id: sourceId,
              type: 'source'
            }
          }
        }
      },
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('PayMongo createPayment error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errors?.[0]?.detail || 'Failed to process payment');
  }
};

/**
 * Retrieve a source by ID
 * @param {string} sourceId - The source ID
 */
export const getSource = async (sourceId) => {
  try {
    const response = await axios.get(
      `${PAYMONGO_API_URL}/sources/${sourceId}`,
      {
        headers: {
          'Authorization': getAuthHeader()
        }
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('PayMongo getSource error:', error.response?.data || error.message);
    throw new Error('Failed to retrieve payment source');
  }
};

/**
 * Retrieve a payment by ID
 * @param {string} paymentId - The payment ID
 */
export const getPayment = async (paymentId) => {
  try {
    const response = await axios.get(
      `${PAYMONGO_API_URL}/payments/${paymentId}`,
      {
        headers: {
          'Authorization': getAuthHeader()
        }
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('PayMongo getPayment error:', error.response?.data || error.message);
    throw new Error('Failed to retrieve payment');
  }
};

/**
 * Verify webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Paymongo-Signature header
 */
export const verifyWebhookSignature = (payload, signature) => {
  try {
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('PAYMONGO_WEBHOOK_SECRET not configured, skipping signature verification');
      return true;
    }

    // PayMongo signature format: t=timestamp,te=test_signature,li=live_signature
    const parts = signature.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('te=') || p.startsWith('li='));

    if (!timestampPart || !signaturePart) {
      return false;
    }

    const timestamp = timestampPart.split('=')[1];
    const receivedSignature = signaturePart.split('=')[1];

    // Construct the signed payload
    const signedPayload = `${timestamp}.${payload}`;

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(receivedSignature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
};

/**
 * Create a refund for a payment
 * @param {string} paymentId - The payment ID to refund
 * @param {number} amount - Amount to refund in PHP (optional, full refund if not provided)
 * @param {string} reason - Reason for refund
 */
export const createRefund = async (paymentId, amount = null, reason = 'requested_by_customer') => {
  try {
    const refundData = {
      data: {
        attributes: {
          payment_id: paymentId,
          reason: reason
        }
      }
    };

    if (amount) {
      refundData.data.attributes.amount = Math.round(amount * 100);
    }

    const response = await axios.post(
      `${PAYMONGO_API_URL}/refunds`,
      refundData,
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('PayMongo createRefund error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errors?.[0]?.detail || 'Failed to process refund');
  }
};

export default {
  createGCashSource,
  createPayment,
  getSource,
  getPayment,
  verifyWebhookSignature,
  createRefund
};
