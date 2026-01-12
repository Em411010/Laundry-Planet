import Service from '../models/Service.js';
import AuditLog from '../models/AuditLog.js';

// Helper function to log audit
const logAudit = async (action, performedBy, changes = {}, req) => {
  try {
    await AuditLog.create({
      action,
      performedBy,
      targetUser: performedBy, // For service changes, log against admin who made change
      changes,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

// Get all services
export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ displayOrder: 1 });

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching services',
      error: error.message
    });
  }
};

// Get single service by ID
export const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching service',
      error: error.message
    });
  }
};

// Update service price (Admin only can update price)
export const updateServicePrice = async (req, res) => {
  try {
    const { price } = req.body;
    const serviceId = req.params.id;

    if (price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: 'Price is required'
      });
    }

    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative'
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const oldPrice = service.price;
    service.price = price;
    await service.save();

    // Log audit
    await logAudit('PRICE_UPDATED', req.userId, {
      service: service.name,
      priceChange: { from: oldPrice, to: price }
    }, req);

    res.json({
      success: true,
      message: 'Service price updated successfully',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating service price',
      error: error.message
    });
  }
};

// Toggle service active status
export const toggleServiceStatus = async (req, res) => {
  try {
    const serviceId = req.params.id;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const newStatus = !service.isActive;
    service.isActive = newStatus;
    await service.save();

    // Log audit
    await logAudit('SERVICE_STATUS_CHANGED', req.userId, {
      service: service.name,
      statusChange: { from: !newStatus, to: newStatus }
    }, req);

    res.json({
      success: true,
      message: `Service ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: newStatus }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling service status',
      error: error.message
    });
  }
};

// Bulk update prices
export const bulkUpdatePrices = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { serviceId, price }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of price updates'
      });
    }

    const results = [];
    for (const update of updates) {
      const service = await Service.findById(update.serviceId);
      if (service) {
        const oldPrice = service.price;
        service.price = update.price;
        await service.save();

        // Log each change
        await logAudit('PRICE_UPDATED', req.userId, {
          service: service.name,
          priceChange: { from: oldPrice, to: update.price },
          bulk: true
        }, req);

        results.push({ serviceId: update.serviceId, success: true });
      } else {
        results.push({ serviceId: update.serviceId, success: false, error: 'Service not found' });
      }
    }

    res.json({
      success: true,
      message: `${results.filter(r => r.success).length} prices updated successfully`,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error performing bulk price update',
      error: error.message
    });
  }
};
