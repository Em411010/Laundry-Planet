import AuditLog from '../models/AuditLog.js';

// Get all audit logs (Admin only)
export const getAllAuditLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      action = '',
      performedBy = '',
      targetUser = '',
      startDate = '',
      endDate = ''
    } = req.query;

    const query = {};
    
    // Filter by action type
    if (action) {
      query.action = action;
    }

    // Filter by who performed the action
    if (performedBy) {
      query.performedBy = performedBy;
    }

    // Filter by target user
    if (targetUser) {
      query.targetUser = targetUser;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('performedBy', 'firstName lastName email role')
      .populate('targetUser', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching audit logs',
      error: error.message
    });
  }
};

// Get audit log statistics
export const getAuditStats = async (req, res) => {
  try {
    const stats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalLogs = await AuditLog.countDocuments();
    const recentLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('performedBy', 'firstName lastName')
      .populate('targetUser', 'firstName lastName');

    res.json({
      success: true,
      data: {
        totalLogs,
        actionBreakdown: stats,
        recentActivity: recentLogs
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching audit statistics',
      error: error.message
    });
  }
};
