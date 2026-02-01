import User from '../models/User.js';
import Order from '../models/Order.js';

// Get comprehensive customer report
export const getCustomerReport = async (req, res) => {
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
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateFilter = { createdAt: { $gte: weekAgo } };
          break;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          dateFilter = { createdAt: { $gte: monthAgo } };
          break;
        case 'year':
          const yearAgo = new Date();
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          dateFilter = { createdAt: { $gte: yearAgo } };
          break;
      }
    }

    // Get all customers (clients only)
    const allCustomers = await User.find({ role: 'client' }).sort({ createdAt: -1 });
    const totalCustomers = allCustomers.length;

    // Get new customers in period
    const newCustomers = dateFilter.createdAt 
      ? await User.find({ role: 'client', ...dateFilter })
      : allCustomers;

    // Get all orders for customer analysis
    const allOrders = await Order.find()
      .populate('customer', 'firstName lastName email createdAt')
      .populate('services.service', 'name');

    // Calculate customer metrics
    const customersWithOrders = new Set(allOrders.map(o => o.customer?._id?.toString()).filter(Boolean));
    const activeCustomers = customersWithOrders.size;

    // Customer lifetime value analysis
    const customerValues = {};
    const customerOrderCount = {};
    const customerFirstOrder = {};
    const customerLastOrder = {};

    allOrders.forEach(order => {
      const customerId = order.customer?._id?.toString();
      if (!customerId) return;

      if (!customerValues[customerId]) {
        customerValues[customerId] = {
          id: customerId,
          name: `${order.customer.firstName} ${order.customer.lastName}`,
          email: order.customer.email,
          totalSpent: 0,
          orderCount: 0,
          averageOrderValue: 0,
          memberSince: order.customer.createdAt
        };
        customerOrderCount[customerId] = [];
        customerFirstOrder[customerId] = order.createdAt;
        customerLastOrder[customerId] = order.createdAt;
      }

      customerValues[customerId].totalSpent += order.totalAmount || 0;
      customerValues[customerId].orderCount++;
      customerOrderCount[customerId].push(order.createdAt);

      if (new Date(order.createdAt) < new Date(customerFirstOrder[customerId])) {
        customerFirstOrder[customerId] = order.createdAt;
      }
      if (new Date(order.createdAt) > new Date(customerLastOrder[customerId])) {
        customerLastOrder[customerId] = order.createdAt;
      }
    });

    // Calculate averages and add retention info
    Object.keys(customerValues).forEach(customerId => {
      const customer = customerValues[customerId];
      customer.averageOrderValue = customer.orderCount > 0 
        ? customer.totalSpent / customer.orderCount 
        : 0;
      
      const daysSinceLastOrder = Math.floor(
        (new Date() - new Date(customerLastOrder[customerId])) / (1000 * 60 * 60 * 24)
      );
      customer.daysSinceLastOrder = daysSinceLastOrder;
      customer.isActive = daysSinceLastOrder <= 30;
    });

    // Top customers by lifetime value
    const topCustomers = Object.values(customerValues)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Calculate average customer metrics
    const customerValuesArray = Object.values(customerValues);
    const avgLifetimeValue = customerValuesArray.length > 0
      ? customerValuesArray.reduce((sum, c) => sum + c.totalSpent, 0) / customerValuesArray.length
      : 0;
    const avgOrdersPerCustomer = customerValuesArray.length > 0
      ? customerValuesArray.reduce((sum, c) => sum + c.orderCount, 0) / customerValuesArray.length
      : 0;

    // Geographic distribution
    const locationData = {};
    allCustomers.forEach(customer => {
      const city = customer.address?.city || 'Unknown';
      if (!locationData[city]) {
        locationData[city] = { city, count: 0, customers: [] };
      }
      locationData[city].count++;
      locationData[city].customers.push({
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email
      });
    });

    const geographicDistribution = Object.values(locationData)
      .sort((a, b) => b.count - a.count);

    // Service preferences
    const servicePreferences = {};
    allOrders.forEach(order => {
      if (order.services && order.services.length > 0) {
        order.services.forEach(item => {
          const serviceName = item.service?.name || 'Unknown';
          if (!servicePreferences[serviceName]) {
            servicePreferences[serviceName] = {
              name: serviceName,
              orderCount: 0,
              totalQuantity: 0,
              customers: new Set()
            };
          }
          servicePreferences[serviceName].orderCount++;
          servicePreferences[serviceName].totalQuantity += item.quantity || 0;
          if (order.customer?._id) {
            servicePreferences[serviceName].customers.add(order.customer._id.toString());
          }
        });
      }
    });

    const preferredServices = Object.values(servicePreferences)
      .map(service => ({
        name: service.name,
        orderCount: service.orderCount,
        totalQuantity: service.totalQuantity,
        uniqueCustomers: service.customers.size
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 10);

    // Peak ordering times analysis
    const hourlyOrders = Array(24).fill(0);
    const dailyOrders = Array(7).fill(0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    allOrders.forEach(order => {
      const date = new Date(order.createdAt);
      hourlyOrders[date.getHours()]++;
      dailyOrders[date.getDay()]++;
    });

    const peakHour = hourlyOrders.indexOf(Math.max(...hourlyOrders));
    const peakDay = dayNames[dailyOrders.indexOf(Math.max(...dailyOrders))];

    // Registration trends (monthly)
    const registrationTrends = {};
    allCustomers.forEach(customer => {
      const month = new Date(customer.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      if (!registrationTrends[month]) {
        registrationTrends[month] = { month, count: 0 };
      }
      registrationTrends[month].count++;
    });

    const registrationByMonth = Object.values(registrationTrends);

    // Customer retention analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyActiveCustomers = Object.values(customerValues)
      .filter(c => c.daysSinceLastOrder <= 30).length;
    const retentionRate = activeCustomers > 0 
      ? ((recentlyActiveCustomers / activeCustomers) * 100).toFixed(2)
      : 0;

    // Order frequency distribution
    const frequencyBuckets = {
      '1-2 orders': 0,
      '3-5 orders': 0,
      '6-10 orders': 0,
      '11+ orders': 0
    };

    customerValuesArray.forEach(customer => {
      if (customer.orderCount <= 2) frequencyBuckets['1-2 orders']++;
      else if (customer.orderCount <= 5) frequencyBuckets['3-5 orders']++;
      else if (customer.orderCount <= 10) frequencyBuckets['6-10 orders']++;
      else frequencyBuckets['11+ orders']++;
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          newCustomers: newCustomers.length,
          activeCustomers,
          avgLifetimeValue,
          avgOrdersPerCustomer,
          retentionRate
        },
        topCustomers,
        geographicDistribution,
        preferredServices,
        orderBehavior: {
          peakHour: `${peakHour}:00`,
          peakDay,
          hourlyDistribution: hourlyOrders.map((count, hour) => ({
            hour: `${hour}:00`,
            orders: count
          })),
          dailyDistribution: dailyOrders.map((count, index) => ({
            day: dayNames[index],
            orders: count
          })),
          frequencyBuckets
        },
        registrationTrends: registrationByMonth,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          period: period || 'all'
        }
      }
    });

  } catch (error) {
    console.error('Error generating customer report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate customer report',
      error: error.message
    });
  }
};

// Get customer segmentation data
export const getCustomerSegmentation = async (req, res) => {
  try {
    const allOrders = await Order.find().populate('customer', 'firstName lastName email createdAt');

    const customerData = {};
    allOrders.forEach(order => {
      const customerId = order.customer?._id?.toString();
      if (!customerId) return;

      if (!customerData[customerId]) {
        customerData[customerId] = {
          id: customerId,
          name: `${order.customer.firstName} ${order.customer.lastName}`,
          totalSpent: 0,
          orderCount: 0
        };
      }
      customerData[customerId].totalSpent += order.totalAmount || 0;
      customerData[customerId].orderCount++;
    });

    // Segment customers
    const segments = {
      vip: [], // >10 orders or >50000 spent
      loyal: [], // 5-10 orders or 20000-50000 spent
      regular: [], // 2-4 orders or 5000-20000 spent
      new: [] // 1 order or <5000 spent
    };

    Object.values(customerData).forEach(customer => {
      if (customer.orderCount > 10 || customer.totalSpent > 50000) {
        segments.vip.push(customer);
      } else if (customer.orderCount >= 5 || customer.totalSpent >= 20000) {
        segments.loyal.push(customer);
      } else if (customer.orderCount >= 2 || customer.totalSpent >= 5000) {
        segments.regular.push(customer);
      } else {
        segments.new.push(customer);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        segments: {
          vip: { count: segments.vip.length, customers: segments.vip.slice(0, 10) },
          loyal: { count: segments.loyal.length, customers: segments.loyal.slice(0, 10) },
          regular: { count: segments.regular.length, customers: segments.regular.slice(0, 10) },
          new: { count: segments.new.length, customers: segments.new.slice(0, 10) }
        }
      }
    });

  } catch (error) {
    console.error('Error getting customer segmentation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get customer segmentation',
      error: error.message
    });
  }
};
