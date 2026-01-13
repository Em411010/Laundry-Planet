import Order from '../models/Order.js';
import User from '../models/User.js';
import Service from '../models/Service.js';

// Get Admin Dashboard Statistics
export const getAdminDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // User Statistics
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
      role: { $ne: 'admin' }
    });
    const activeStaff = await User.countDocuments({ 
      role: 'staff', 
      isActive: true 
    });

    // Order Statistics
    const totalOrders = await Order.countDocuments();
    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: today }
    });
    const ordersThisWeek = await Order.countDocuments({
      createdAt: { $gte: startOfWeek }
    });
    const pendingTasks = await Order.countDocuments({
      status: { $in: ['pending', 'accepted', 'for-delivery'] }
    });

    // Revenue Statistics
    const revenueData = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    const thisMonthRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const thisWeekRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfWeek }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const lastMonthRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: lastMonth, $lte: endOfLastMonth }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Last 7 days revenue
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const last7DaysRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Last 30 days revenue
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const last30DaysRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Most Popular Service
    const popularService = await Order.aggregate([
      { $unwind: '$services' },
      {
        $group: {
          _id: '$services.service',
          count: { $sum: 1 },
          totalWeight: { $sum: '$services.quantity' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'serviceDetails'
        }
      }
    ]);

    // Recent Orders
    const recentOrders = await Order.find()
      .populate('customer', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber customer status totalAmount createdAt');

    // Recent Feedback/Complaints (using messages with specific tags or new feedback system)
    const recentFeedback = await Order.aggregate([
      { $unwind: '$messages' },
      {
        $match: {
          'messages.messageType': { $in: ['feedback', 'complaint', 'issue'] }
        }
      },
      { $sort: { 'messages.timestamp': -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerDetails'
        }
      },
      {
        $project: {
          orderNumber: 1,
          customer: { $arrayElemAt: ['$customerDetails', 0] },
          message: '$messages.message',
          messageType: '$messages.messageType',
          timestamp: '$messages.timestamp'
        }
      }
    ]);

    const revenue = revenueData[0] || { totalRevenue: 0, avgOrderValue: 0 };
    const thisMonthRev = thisMonthRevenue[0]?.revenue || 0;
    const lastMonthRev = lastMonthRevenue[0]?.revenue || 0;
    const revenueGrowth = lastMonthRev > 0 
      ? ((thisMonthRev - lastMonthRev) / lastMonthRev * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        keyMetrics: {
          totalRevenue: revenue.totalRevenue,
          thisMonthRevenue: thisMonthRev,
          revenueGrowth,
          totalOrders,
          ordersToday,
          ordersThisWeek,
          activeUsers: totalUsers,
          pendingTasks
        },
        revenueChart: {
          last7Days: last7DaysRevenue,
          last30Days: last30DaysRevenue
        },
        quickStats: {
          ordersToday,
          weekRevenue: thisWeekRevenue[0]?.revenue || 0,
          newUsersThisMonth,
          mostPopularService: popularService[0]?.serviceDetails[0]?.name || 'N/A',
          avgOrderValue: revenue.avgOrderValue
        },
        staffOverview: {
          activeStaff,
          totalStaff: await User.countDocuments({ role: 'staff' })
        },
        recentActivity: recentOrders,
        recentFeedback: recentFeedback.map(f => ({
          orderNumber: f.orderNumber,
          customer: `${f.customer?.firstName} ${f.customer?.lastName}`,
          message: f.message,
          type: f.messageType,
          date: f.timestamp
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};
