import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  services: [{
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    }
  }],
  pickupAddress: {
    street: String,
    barangay: String,
    city: String,
    province: String,
    zipCode: String,
    fullAddress: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  contactPhone: {
    type: String,
    required: true
  },
  pickupDate: {
    type: Date,
    required: true
  },
  pickupTime: {
    type: String,
    required: true
  },
  specialInstructions: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: [
      'pending',        // For Pick-Up (waiting for staff to accept)
      'accepted',       // Pickup (accepted by staff, ready to pickup)
      'picked-up',      // On the Shop (picked up, at the shop)
      'in-progress',    // On Going the services (washing/drying/folding)
      'processed',      // Services Done (laundry finished, waiting for delivery assignment)
      'for-delivery',   // For Delivery (delivery staff assigned)
      'delivered',      // Completed
      'cancelled'
    ],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'gcash', 'bank-transfer'],
    default: 'cash'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  assignedStaff: {
    pickup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    processing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  actualWeight: {
    type: Number,
    default: 0
  },
  images: [{
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: Date
    }]
  }],
  notes: [{
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Generate order number
orderSchema.pre('save', async function() {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const count = await mongoose.model('Order').countDocuments();
    const orderNum = String(count + 1).padStart(4, '0');
    
    this.orderNumber = `LP${year}${month}${day}-${orderNum}`;
  }
});

// Add status to history when status changes
orderSchema.pre('save', function() {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
