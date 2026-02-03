import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Service from '../models/Service.js';

dotenv.config();

// Filipino names for realistic data
const firstNames = ['Maria', 'Jose', 'Juan', 'Ana', 'Pedro', 'Rosa', 'Miguel', 'Elena', 'Carlos', 'Sofia', 'Ramon', 'Lucia', 'Antonio', 'Carmen', 'Francisco'];
const lastNames = ['Santos', 'Reyes', 'Cruz', 'Garcia', 'Ramos', 'Mendoza', 'Torres', 'Flores', 'Gonzales', 'Bautista', 'Villanueva', 'Fernandez', 'Lopez', 'Martinez', 'Delgado'];

// Cebu City barangays and areas
const barangays = ['Lahug', 'Banilad', 'Mabolo', 'Talamban', 'Guadalupe', 'Capitol Site', 'Kamputhaw', 'Apas', 'Kasambagan', 'IT Park'];
const streets = ['Salinas Drive', 'Gorordo Avenue', 'Archbishop Reyes Ave', 'A.S. Fortuna St', 'General Maxilom Ave', 'M.J. Cuenco Ave', 'Osmena Blvd', 'Colon St', 'V. Rama Ave', 'N. Bacalso Ave'];

// Random helpers
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;

// Generate random phone number
const generatePhone = () => `09${randomInt(10, 99)}${randomInt(100, 999)}${randomInt(1000, 9999)}`;

// Generate random date within range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Pickup time slots
const timeSlots = ['8:00 AM - 10:00 AM', '10:00 AM - 12:00 PM', '1:00 PM - 3:00 PM', '3:00 PM - 5:00 PM', '5:00 PM - 7:00 PM'];

// Special instructions
const instructions = [
  '',
  'Please handle with care',
  'Separate whites from colored clothes',
  'Use fabric softener please',
  'No bleach on any items',
  'Extra rinse cycle please',
  'Fold neatly, thank you',
  'Call before pickup',
  'Leave at guard house if not home',
  'Ring doorbell twice',
  'Prefer morning delivery',
  'Please use mild detergent',
  ''
];

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/laundry-planet';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedClients = async () => {
  console.log('\n📦 Creating 10 client accounts...\n');
  
  const clients = [];
  const usedEmails = new Set();
  const hashedPassword = await bcrypt.hash('Test@1234', 12);

  for (let i = 0; i < 10; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    let email;
    
    // Ensure unique email
    do {
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 99)}@gmail.com`;
    } while (usedEmails.has(email));
    usedEmails.add(email);

    const barangay = randomElement(barangays);
    const street = randomElement(streets);
    const houseNum = randomInt(1, 500);
    const fullAddress = `${houseNum} ${street}, ${barangay}, Cebu City, Cebu`;

    const client = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'client',
      isActive: true,
      isEmailVerified: true,
      phone: generatePhone(),
      address: {
        street: `${houseNum} ${street}`,
        barangay,
        city: 'Cebu City',
        province: 'Cebu',
        zipCode: '6000',
        fullAddress
      },
      location: {
        type: 'Point',
        coordinates: [
          123.8854 + randomFloat(-0.02, 0.02), // Longitude (Cebu City area)
          10.3157 + randomFloat(-0.02, 0.02)   // Latitude
        ]
      },
      profileComplete: true
    };

    clients.push(client);
  }

  // Insert clients
  const insertedClients = await User.insertMany(clients);
  console.log('✅ Created 10 client accounts:');
  insertedClients.forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.firstName} ${c.lastName} (${c.email})`);
  });

  return insertedClients;
};

const seedOrders = async (clients, services, staffMembers) => {
  console.log('\n📦 Creating 3 months of orders for each client...\n');

  const orders = [];
  const now = new Date();
  
  // 3 months ago
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  
  const orderStatuses = ['pending', 'accepted', 'picked-up', 'in-progress', 'processed', 'for-delivery', 'delivered', 'cancelled'];
  const paymentStatuses = ['unpaid', 'paid'];
  const paymentMethods = ['cash', 'gcash'];

  // Service combinations that make sense
  const serviceCombinations = [
    // Single service orders
    (svcs) => [svcs.find(s => s.name === 'T-shirts, Shirts, Shorts')],
    (svcs) => [svcs.find(s => s.name === 'Jeans, Towels, Jackets')],
    (svcs) => [svcs.find(s => s.name === 'Comforter')],
    (svcs) => [svcs.find(s => s.name === 'Dry Only')],
    (svcs) => [svcs.find(s => s.name === 'Dry + Fold')],
    // Combo orders
    (svcs) => [
      svcs.find(s => s.name === 'T-shirts, Shirts, Shorts'),
      svcs.find(s => s.name === 'Jeans, Towels, Jackets')
    ],
    (svcs) => [
      svcs.find(s => s.name === 'T-shirts, Shirts, Shorts'),
      svcs.find(s => s.name === 'Dry Only')
    ],
    (svcs) => [
      svcs.find(s => s.name === 'Jeans, Towels, Jackets'),
      svcs.find(s => s.name === 'Comforter')
    ],
    // Heavy loads
    (svcs) => [
      svcs.find(s => s.name === 'T-shirts, Shirts, Shorts'),
      svcs.find(s => s.name === 'Jeans, Towels, Jackets'),
      svcs.find(s => s.name === 'Comforter')
    ]
  ];

  let orderCount = 0;

  for (const client of clients) {
    // Each client gets 5-15 orders over 3 months (realistic usage)
    const numOrders = randomInt(5, 15);

    for (let i = 0; i < numOrders; i++) {
      // Random date within last 3 months
      const orderDate = randomDate(threeMonthsAgo, now);
      const pickupDate = new Date(orderDate);
      pickupDate.setDate(pickupDate.getDate() + randomInt(0, 2));
      
      const deliverDate = new Date(pickupDate);
      deliverDate.setDate(deliverDate.getDate() + randomInt(1, 3));

      // Select random service combination
      const getServices = randomElement(serviceCombinations);
      const selectedServices = getServices(services).filter(Boolean);

      if (selectedServices.length === 0) continue;

      // Calculate order details
      const orderServices = [];
      let servicesSubtotal = 0;
      let totalWeight = 0;

      for (const service of selectedServices) {
        // Realistic quantities (kg) based on service type
        let quantity;
        if (service.name === 'Comforter') {
          quantity = randomInt(3, 6); // 3-6 kg for comforters
        } else if (service.unit === 'per load') {
          quantity = 1; // Loads are counted as 1
        } else {
          quantity = randomInt(4, 12); // 4-12 kg for regular laundry
        }

        const subtotal = service.price * quantity;
        servicesSubtotal += subtotal;
        totalWeight += quantity;

        orderServices.push({
          service: service._id,
          quantity,
          price: service.price,
          subtotal
        });
      }

      // Calculate shipping fee (free if >= 4kg)
      const shippingFee = totalWeight >= 4 ? 0 : 50;
      const totalAmount = servicesSubtotal + shippingFee;

      // Determine status based on order age
      const daysSinceOrder = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
      let status, paymentStatus;

      if (daysSinceOrder > 7) {
        // Older orders are mostly completed
        status = Math.random() > 0.08 ? 'delivered' : 'cancelled';
        paymentStatus = status === 'delivered' ? 'paid' : (Math.random() > 0.5 ? 'paid' : 'unpaid');
      } else if (daysSinceOrder > 3) {
        // Medium age orders are in various stages
        const midStatuses = ['processed', 'for-delivery', 'delivered'];
        status = randomElement(midStatuses);
        paymentStatus = status === 'delivered' ? 'paid' : randomElement(paymentStatuses);
      } else if (daysSinceOrder > 1) {
        // Recent orders are in early stages
        const earlyStatuses = ['pending', 'accepted', 'picked-up', 'in-progress'];
        status = randomElement(earlyStatuses);
        paymentStatus = Math.random() > 0.7 ? 'paid' : 'unpaid';
      } else {
        // Today's orders are mostly pending
        status = Math.random() > 0.3 ? 'pending' : 'accepted';
        paymentStatus = 'unpaid';
      }

      // Generate order number (LP-YYYYMMDD-XXXX format)
      const dateStr = orderDate.toISOString().slice(0, 10).replace(/-/g, '');
      const orderNum = `LP-${dateStr}-${String(orderCount + 1).padStart(4, '0')}`;

      const order = {
        orderNumber: orderNum,
        customer: client._id,
        isWalkIn: false,
        services: orderServices,
        pickupAddress: {
          street: client.address.street,
          barangay: client.address.barangay,
          city: client.address.city,
          province: client.address.province,
          zipCode: client.address.zipCode,
          fullAddress: client.address.fullAddress,
          location: client.location
        },
        contactPhone: client.phone,
        pickupDate,
        pickupTime: randomElement(timeSlots),
        deliverDate,
        deliverTime: randomElement(timeSlots),
        specialInstructions: randomElement(instructions),
        status,
        paymentStatus,
        paymentMethod: randomElement(paymentMethods),
        servicesSubtotal,
        shippingFee,
        totalAmount,
        actualWeight: status !== 'pending' ? totalWeight : 0,
        assignedStaff: status !== 'pending' && staffMembers.length > 0 ? {
          pickup: randomElement(staffMembers)._id,
          processing: status !== 'accepted' ? randomElement(staffMembers)._id : undefined,
          delivery: ['for-delivery', 'delivered'].includes(status) ? randomElement(staffMembers)._id : undefined
        } : {},
        createdAt: orderDate,
        updatedAt: orderDate
      };

      orders.push(order);
      orderCount++;
    }
  }

  // Also add some walk-in orders for variety
  console.log('📦 Adding walk-in orders...\n');
  const walkInCustomers = [
    { firstName: 'Mark', lastName: 'Tan', phone: generatePhone() },
    { firstName: 'Jenny', lastName: 'Lim', phone: generatePhone() },
    { firstName: 'Robert', lastName: 'Chua', phone: generatePhone() },
    { firstName: 'Grace', lastName: 'Ong', phone: generatePhone() },
    { firstName: 'Daniel', lastName: 'Sy', phone: generatePhone() }
  ];

  for (let i = 0; i < 20; i++) {
    const orderDate = randomDate(threeMonthsAgo, now);
    const guest = randomElement(walkInCustomers);
    
    const getServices = randomElement(serviceCombinations);
    const selectedServices = getServices(services).filter(Boolean);
    if (selectedServices.length === 0) continue;

    const orderServices = [];
    let servicesSubtotal = 0;
    let totalWeight = 0;

    for (const service of selectedServices) {
      const quantity = service.name === 'Comforter' ? randomInt(3, 5) : 
                       service.unit === 'per load' ? 1 : randomInt(4, 10);
      const subtotal = service.price * quantity;
      servicesSubtotal += subtotal;
      totalWeight += quantity;
      orderServices.push({
        service: service._id,
        quantity,
        price: service.price,
        subtotal
      });
    }

    const shippingFee = 0; // Walk-ins don't have shipping
    const daysSinceOrder = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
    const status = daysSinceOrder > 3 ? 'delivered' : randomElement(['in-progress', 'processed', 'delivered']);
    
    const dateStr = orderDate.toISOString().slice(0, 10).replace(/-/g, '');
    const orderNum = `LP-${dateStr}-${String(orderCount + 1).padStart(4, '0')}`;

    orders.push({
      orderNumber: orderNum,
      guestCustomer: {
        firstName: guest.firstName,
        lastName: guest.lastName,
        phone: guest.phone
      },
      isWalkIn: true,
      createdBy: staffMembers.length > 0 ? randomElement(staffMembers)._id : undefined,
      services: orderServices,
      pickupAddress: {
        fullAddress: 'Walk-in Customer'
      },
      contactPhone: guest.phone,
      pickupDate: orderDate,
      pickupTime: randomElement(timeSlots),
      specialInstructions: randomElement(instructions),
      status,
      paymentStatus: status === 'delivered' ? 'paid' : 'unpaid',
      paymentMethod: 'cash',
      servicesSubtotal,
      shippingFee: 0,
      totalAmount: servicesSubtotal,
      actualWeight: totalWeight,
      createdAt: orderDate,
      updatedAt: orderDate
    });
    orderCount++;
  }

  // Sort orders by date for consistent order numbers
  orders.sort((a, b) => a.createdAt - b.createdAt);

  // Re-assign order numbers in chronological order
  orders.forEach((order, index) => {
    const dateStr = order.createdAt.toISOString().slice(0, 10).replace(/-/g, '');
    order.orderNumber = `LP-${dateStr}-${String(index + 1).padStart(4, '0')}`;
  });

  // Insert orders
  const insertedOrders = await Order.insertMany(orders);
  console.log(`✅ Created ${insertedOrders.length} orders total\n`);

  // Summary statistics
  const statusCounts = {};
  const monthlyRevenue = {};
  
  insertedOrders.forEach(order => {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    
    const monthKey = order.createdAt.toISOString().slice(0, 7);
    if (!monthlyRevenue[monthKey]) {
      monthlyRevenue[monthKey] = { revenue: 0, orders: 0 };
    }
    monthlyRevenue[monthKey].revenue += order.totalAmount;
    monthlyRevenue[monthKey].orders += 1;
  });

  console.log('📊 Order Status Summary:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });

  console.log('\n📈 Monthly Revenue Summary:');
  Object.entries(monthlyRevenue).sort().forEach(([month, data]) => {
    console.log(`   ${month}: ₱${data.revenue.toLocaleString()} (${data.orders} orders)`);
  });

  return insertedOrders;
};

const main = async () => {
  console.log('🚀 Starting Laundry Planet Test Data Seeder\n');
  console.log('=' .repeat(50));

  await connectDB();

  // Get existing services
  const services = await Service.find({ isActive: true });
  if (services.length === 0) {
    console.log('❌ No services found! Please ensure services are seeded first.');
    process.exit(1);
  }
  console.log(`✅ Found ${services.length} active services`);

  // Get existing staff members (for assignment)
  const staffMembers = await User.find({ role: { $in: ['staff', 'admin'] } });
  console.log(`✅ Found ${staffMembers.length} staff members`);

  // Check for existing test clients
  const existingTestClients = await User.countDocuments({ 
    email: { $regex: /^(maria|jose|juan|ana|pedro|rosa|miguel|elena|carlos|sofia)\./i }
  });
  
  if (existingTestClients > 0) {
    console.log(`\n⚠️  Found ${existingTestClients} existing test clients.`);
    console.log('   Deleting existing test data...');
    
    // Delete existing test orders and clients
    const testClientIds = await User.find({ 
      email: { $regex: /^(maria|jose|juan|ana|pedro|rosa|miguel|elena|carlos|sofia)\./i }
    }).select('_id');
    
    await Order.deleteMany({ customer: { $in: testClientIds.map(c => c._id) } });
    await User.deleteMany({ _id: { $in: testClientIds.map(c => c._id) } });
    console.log('   ✅ Cleaned up existing test data');
  }

  // Delete walk-in test orders
  await Order.deleteMany({ 
    isWalkIn: true, 
    'guestCustomer.lastName': { $in: ['Tan', 'Lim', 'Chua', 'Ong', 'Sy'] }
  });

  // Create clients
  const clients = await seedClients();

  // Create orders
  await seedOrders(clients, services, staffMembers);

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Test data seeding completed successfully!\n');
  console.log('📝 Login Credentials for test clients:');
  console.log('   Password: Test@1234');
  console.log('   Emails: Check the list above\n');

  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
