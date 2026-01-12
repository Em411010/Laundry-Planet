import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';

dotenv.config();

const migrateOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all orders with old assignedStaff structure (ObjectId instead of object)
    const orders = await Order.find({});
    console.log(`Found ${orders.length} orders`);

    let migrated = 0;
    for (const order of orders) {
      // Check if assignedStaff is an ObjectId (old structure)
      if (order.assignedStaff && !order.assignedStaff.pickup) {
        console.log(`Migrating order ${order.orderNumber}...`);
        
        // Convert single ObjectId to new structure
        // Since we don't know which stage this staff was assigned for,
        // we'll clear it and let the staff reassign
        order.assignedStaff = {
          pickup: null,
          processing: null,
          delivery: null
        };
        
        await order.save();
        migrated++;
      }
    }

    console.log(`Migration complete! Migrated ${migrated} orders`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateOrders();
