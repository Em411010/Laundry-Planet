import Order from '../models/Order.js';
import Service from '../models/Service.js';

// Get comprehensive sales report with filters
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, period } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else if (period) {
      const now = new Date();
      switch (period) {
        case 'today':
          dateFilter = {
            createdAt: {
              $gte: new Date(now.setHours(0, 0, 0, 0)),
              $lte: new Date(now.setHours(23, 59, 59, 999))
            }
          };
          break;
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateFilter = {
            createdAt: { $gte: weekAgo }
          };
          break;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          dateFilter = {
            createdAt: { $gte: monthAgo }
          };
          break;
        case 'year':
          const yearAgo = new Date();
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          dateFilter = {
            createdAt: { $gte: yearAgo }
          };
          break;
      }
    }

    // Fetch orders with date filter
    const orders = await Order.find(dateFilter)
      .populate('services.service')
      .populate('customer', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Calculate revenue analytics
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const completedOrders = orders.filter(o => o.status === 'completed');
    const completedRevenue = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'in-progress');
    const pendingRevenue = pendingOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Calculate average order value
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Payment method distribution
    const paymentMethods = {};
    orders.forEach(order => {
      const method = order.paymentMethod || 'Unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, revenue: 0 };
      }
      paymentMethods[method].count++;
      paymentMethods[method].revenue += order.totalAmount || 0;
    });

    // Payment status tracking
    const paymentStatus = {
      paid: { count: 0, revenue: 0 },
      pending: { count: 0, revenue: 0 },
      failed: { count: 0, revenue: 0 }
    };
    orders.forEach(order => {
      const status = order.paymentStatus || 'pending';
      if (paymentStatus[status]) {
        paymentStatus[status].count++;
        paymentStatus[status].revenue += order.totalAmount || 0;
      }
    });

    // Service performance analysis
    const serviceStats = {};
    orders.forEach(order => {
      if (order.services && order.services.length > 0) {
        order.services.forEach(item => {
          const serviceName = item.service?.name || 'Unknown Service';
          if (!serviceStats[serviceName]) {
            serviceStats[serviceName] = {
              name: serviceName,
              quantity: 0,
              revenue: 0,
              orders: 0
            };
          }
          serviceStats[serviceName].quantity += item.quantity || 0;
          serviceStats[serviceName].revenue += item.subtotal || (item.price * item.quantity);
          serviceStats[serviceName].orders++;
        });
      }
    });

    // Convert to array and sort by revenue
    const topServices = Object.values(serviceStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Daily revenue trend (last 30 days or within date range)
    const dailyRevenue = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString();
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = { date, revenue: 0, orders: 0 };
      }
      dailyRevenue[date].revenue += order.totalAmount || 0;
      dailyRevenue[date].orders++;
    });

    const revenueTrend = Object.values(dailyRevenue).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Monthly revenue (current year)
    const monthlyRevenue = {};
    orders.forEach(order => {
      const month = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyRevenue[month]) {
        monthlyRevenue[month] = { month, revenue: 0, orders: 0 };
      }
      monthlyRevenue[month].revenue += order.totalAmount || 0;
      monthlyRevenue[month].orders++;
    });

    const monthlyTrend = Object.values(monthlyRevenue);

    // Order statistics
    const orderStats = {
      total: orders.length,
      completed: completedOrders.length,
      pending: pendingOrders.length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      completionRate: orders.length > 0 ? ((completedOrders.length / orders.length) * 100).toFixed(2) : 0
    };

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          completedRevenue,
          pendingRevenue,
          averageOrderValue,
          totalOrders: orders.length
        },
        orderStats,
        paymentMethods,
        paymentStatus,
        topServices,
        revenueTrend,
        monthlyTrend,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          period: period || 'all'
        }
      }
    });

  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sales report',
      error: error.message
    });
  }
};

// Get revenue by date range with detailed breakdown
export const getRevenueByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const orders = await Order.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('services.service');

    const dailyBreakdown = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString();
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = {
          date,
          revenue: 0,
          orders: 0,
          completed: 0,
          pending: 0
        };
      }
      dailyBreakdown[date].revenue += order.totalAmount || 0;
      dailyBreakdown[date].orders++;
      if (order.status === 'completed') {
        dailyBreakdown[date].completed++;
      } else {
        dailyBreakdown[date].pending++;
      }
    });

    const breakdown = Object.values(dailyBreakdown).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    res.status(200).json({
      success: true,
      data: {
        breakdown,
        summary: {
          totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
          totalOrders: orders.length,
          averageDaily: breakdown.length > 0 ? 
            (orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / breakdown.length).toFixed(2) : 0
        }
      }
    });

  } catch (error) {
    console.error('Error getting revenue by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue data',
      error: error.message
    });
  }
};

// Get top performing services
export const getTopServices = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const orders = await Order.find(dateFilter).populate('services.service');

    const serviceStats = {};
    orders.forEach(order => {
      if (order.services && order.services.length > 0) {
        order.services.forEach(item => {
          const serviceId = item.service?._id?.toString();
          const serviceName = item.service?.name || 'Unknown';
          
          if (!serviceStats[serviceId]) {
            serviceStats[serviceId] = {
              id: serviceId,
              name: serviceName,
              totalRevenue: 0,
              totalQuantity: 0,
              orderCount: 0,
              averagePrice: 0
            };
          }
          
          serviceStats[serviceId].totalRevenue += item.subtotal || (item.price * item.quantity);
          serviceStats[serviceId].totalQuantity += item.quantity || 0;
          serviceStats[serviceId].orderCount++;
        });
      }
    });

    // Calculate average price and sort
    const topServices = Object.values(serviceStats)
      .map(service => ({
        ...service,
        averagePrice: service.totalQuantity > 0 ? 
          (service.totalRevenue / service.totalQuantity).toFixed(2) : 0
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: topServices
    });

  } catch (error) {
    console.error('Error getting top services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top services',
      error: error.message
    });
  }
};
