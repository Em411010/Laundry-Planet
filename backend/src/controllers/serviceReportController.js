import Order from '../models/Order.js';
import Service from '../models/Service.js';
import User from '../models/User.js';

// Get comprehensive service report
export const getServiceReport = async (req, res) => {
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

    // Get all services
    const allServices = await Service.find();
    
    // Get all orders with date filter
    const orders = await Order.find(dateFilter)
      .populate('services.service')
      .populate('assignedStaff.pickup assignedStaff.processing assignedStaff.delivery', 'firstName lastName email');

    // Service popularity and revenue analysis
    const serviceStats = {};
    allServices.forEach(service => {
      serviceStats[service._id.toString()] = {
        id: service._id,
        name: service.name,
        category: service.category,
        price: service.price,
        totalOrders: 0,
        totalQuantity: 0,
        totalRevenue: 0,
        averageQuantityPerOrder: 0,
        completedOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        successRate: 0,
        staffHandling: {},
        hourlyDistribution: Array(24).fill(0),
        dailyDistribution: Array(7).fill(0)
      };
    });

    // Process orders to build statistics
    orders.forEach(order => {
      if (order.services && order.services.length > 0) {
        const orderHour = new Date(order.createdAt).getHours();
        const orderDay = new Date(order.createdAt).getDay();

        order.services.forEach(item => {
          const serviceId = item.service?._id?.toString();
          if (serviceId && serviceStats[serviceId]) {
            const stats = serviceStats[serviceId];
            
            stats.totalOrders++;
            stats.totalQuantity += item.quantity || 0;
            stats.totalRevenue += item.subtotal || (item.price * item.quantity);
            
            // Track hourly and daily distribution
            stats.hourlyDistribution[orderHour]++;
            stats.dailyDistribution[orderDay]++;

            // Track by order status
            if (order.status === 'completed') {
              stats.completedOrders++;
            } else if (order.status === 'cancelled') {
              stats.cancelledOrders++;
            } else {
              stats.pendingOrders++;
            }

            // Track staff handling
            ['pickup', 'processing', 'delivery'].forEach(role => {
              const staff = order.assignedStaff?.[role];
              if (staff) {
                const staffId = staff._id.toString();
                const staffName = `${staff.firstName} ${staff.lastName}`;
                
                if (!stats.staffHandling[staffId]) {
                  stats.staffHandling[staffId] = {
                    name: staffName,
                    email: staff.email,
                    role,
                    orderCount: 0,
                    totalQuantity: 0
                  };
                }
                stats.staffHandling[staffId].orderCount++;
                stats.staffHandling[staffId].totalQuantity += item.quantity || 0;
              }
            });
          }
        });
      }
    });

    // Calculate derived metrics
    Object.keys(serviceStats).forEach(serviceId => {
      const stats = serviceStats[serviceId];
      
      if (stats.totalOrders > 0) {
        stats.averageQuantityPerOrder = stats.totalQuantity / stats.totalOrders;
        stats.successRate = ((stats.completedOrders / stats.totalOrders) * 100).toFixed(2);
      }
      
      // Convert staff handling to array
      stats.staffHandlingArray = Object.values(stats.staffHandling)
        .sort((a, b) => b.orderCount - a.orderCount);
      
      // Find peak hour and day
      const peakHour = stats.hourlyDistribution.indexOf(Math.max(...stats.hourlyDistribution));
      const peakDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
        stats.dailyDistribution.indexOf(Math.max(...stats.dailyDistribution))
      ];
      
      stats.peakHour = `${peakHour}:00`;
      stats.peakDay = peakDay;
    });

    // Convert to array and sort by popularity
    const serviceArray = Object.values(serviceStats)
      .filter(s => s.totalOrders > 0)
      .sort((a, b) => b.totalOrders - a.totalOrders);

    // Calculate overall metrics
    const totalServiceOrders = serviceArray.reduce((sum, s) => sum + s.totalOrders, 0);
    const totalServiceRevenue = serviceArray.reduce((sum, s) => sum + s.totalRevenue, 0);
    const avgOrdersPerService = serviceArray.length > 0 ? totalServiceOrders / serviceArray.length : 0;
    
    // Most popular services
    const topServices = serviceArray.slice(0, 10);
    
    // Highest revenue services
    const topRevenueServices = [...serviceArray]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Services with best success rate
    const topSuccessRateServices = [...serviceArray]
      .filter(s => s.totalOrders >= 5) // Minimum 5 orders for meaningful rate
      .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate))
      .slice(0, 10);

    // Staff workload distribution
    const staffWorkload = {};
    orders.forEach(order => {
      ['pickup', 'processing', 'delivery'].forEach(role => {
        const staff = order.assignedStaff?.[role];
        if (staff) {
          const staffId = staff._id.toString();
          const staffName = `${staff.firstName} ${staff.lastName}`;
          
          if (!staffWorkload[staffId]) {
            staffWorkload[staffId] = {
              id: staffId,
              name: staffName,
              email: staff.email,
              totalOrders: 0,
              roleDistribution: {
                pickup: 0,
                processing: 0,
                delivery: 0
              },
              serviceTypes: {}
            };
          }
          
          staffWorkload[staffId].totalOrders++;
          staffWorkload[staffId].roleDistribution[role]++;
          
          // Track service types handled
          if (order.services) {
            order.services.forEach(item => {
              const serviceName = item.service?.name || 'Unknown';
              if (!staffWorkload[staffId].serviceTypes[serviceName]) {
                staffWorkload[staffId].serviceTypes[serviceName] = 0;
              }
              staffWorkload[staffId].serviceTypes[serviceName]++;
            });
          }
        }
      });
    });

    const staffWorkloadArray = Object.values(staffWorkload)
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 15);

    // Monthly trend for services
    const monthlyTrend = {};
    orders.forEach(order => {
      const month = new Date(order.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!monthlyTrend[month]) {
        monthlyTrend[month] = {
          month,
          totalOrders: 0,
          totalRevenue: 0,
          serviceCount: {}
        };
      }
      
      monthlyTrend[month].totalOrders++;
      
      if (order.services) {
        order.services.forEach(item => {
          const serviceName = item.service?.name || 'Unknown';
          monthlyTrend[month].totalRevenue += item.subtotal || (item.price * item.quantity);
          
          if (!monthlyTrend[month].serviceCount[serviceName]) {
            monthlyTrend[month].serviceCount[serviceName] = 0;
          }
          monthlyTrend[month].serviceCount[serviceName]++;
        });
      }
    });

    const monthlyTrendArray = Object.values(monthlyTrend);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalServiceOrders,
          totalServiceRevenue,
          avgOrdersPerService: avgOrdersPerService.toFixed(2),
          activeServices: serviceArray.length,
          totalServices: allServices.length
        },
        servicePopularity: {
          topServices,
          utilizationRate: serviceArray.map(s => ({
            name: s.name,
            utilizationRate: ((s.totalOrders / totalServiceOrders) * 100).toFixed(2),
            totalOrders: s.totalOrders
          }))
        },
        performanceMetrics: {
          topSuccessRateServices,
          averageSuccessRate: (
            serviceArray.reduce((sum, s) => sum + parseFloat(s.successRate), 0) / 
            serviceArray.length
          ).toFixed(2)
        },
        revenueContribution: {
          topRevenueServices,
          revenueByService: serviceArray.map(s => ({
            name: s.name,
            revenue: s.totalRevenue,
            percentage: ((s.totalRevenue / totalServiceRevenue) * 100).toFixed(2)
          }))
        },
        demandPatterns: {
          peakHours: serviceArray
            .map(s => ({ name: s.name, peakHour: s.peakHour, peakDay: s.peakDay }))
            .slice(0, 10),
          monthlyTrend: monthlyTrendArray
        },
        staffEfficiency: {
          workloadDistribution: staffWorkloadArray,
          topPerformers: staffWorkloadArray.slice(0, 5)
        },
        detailedServices: serviceArray,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          period: period || 'all'
        }
      }
    });

  } catch (error) {
    console.error('Error generating service report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate service report',
      error: error.message
    });
  }
};

// Get detailed service performance
export const getServicePerformance = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const orders = await Order.find({
      ...dateFilter,
      'services.service': serviceId
    }).populate('assignedStaff.pickup assignedStaff.processing assignedStaff.delivery', 'firstName lastName');

    const performance = {
      service: {
        id: service._id,
        name: service.name,
        category: service.category,
        price: service.price
      },
      totalOrders: 0,
      totalQuantity: 0,
      totalRevenue: 0,
      completedOrders: 0,
      avgCompletionTime: 0,
      customerSatisfaction: 0,
      staffPerformance: []
    };

    orders.forEach(order => {
      const serviceItem = order.services.find(s => s.service.toString() === serviceId);
      if (serviceItem) {
        performance.totalOrders++;
        performance.totalQuantity += serviceItem.quantity || 0;
        performance.totalRevenue += serviceItem.subtotal || (serviceItem.price * serviceItem.quantity);
        
        if (order.status === 'completed') {
          performance.completedOrders++;
        }
      }
    });

    res.status(200).json({
      success: true,
      data: performance
    });

  } catch (error) {
    console.error('Error getting service performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service performance',
      error: error.message
    });
  }
};
