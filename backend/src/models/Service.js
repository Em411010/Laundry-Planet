import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Full Package', 'Dry Service', 'Delivery']
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['per kg', 'per load', 'FREE']
  },
  minRequirement: {
    type: String,
    default: '4kgs per load'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Service = mongoose.model('Service', serviceSchema);

// Function to seed initial services
export const seedServices = async () => {
  try {
    const count = await Service.countDocuments();
    if (count === 0) {
      const initialServices = [
        {
          name: 'T-shirts, Shirts, Shorts',
          category: 'Full Package',
          description: 'Full service: Wash, Dry & Fold',
          price: 29,
          unit: 'per kg',
          minRequirement: '4kgs per load',
          displayOrder: 1,
          isActive: true
        },
        {
          name: 'Jeans, Towels, Jackets',
          category: 'Full Package',
          description: 'Bedsheets, etc. • Full service',
          price: 39,
          unit: 'per kg',
          minRequirement: '4kgs per load',
          displayOrder: 2,
          isActive: true
        },
        {
          name: 'Comforter',
          category: 'Full Package',
          description: 'Full service • Minimum 3kgs',
          price: 70,
          unit: 'per kg',
          minRequirement: 'Minimum 3kgs',
          displayOrder: 3,
          isActive: true
        },
        {
          name: 'Dry Only',
          category: 'Dry Service',
          description: 'Dryer only service',
          price: 75,
          unit: 'per load',
          minRequirement: '4kgs per load',
          displayOrder: 4,
          isActive: true
        },
        {
          name: 'Dry + Fold',
          category: 'Dry Service',
          description: 'Dryer with folding service',
          price: 90,
          unit: 'per load',
          minRequirement: '4kgs per load',
          displayOrder: 5,
          isActive: true
        },
        {
          name: 'Free Pickup & Delivery',
          category: 'Delivery',
          description: 'Within 1km radius • Minimum 6kgs',
          price: 0,
          unit: 'FREE',
          minRequirement: 'Minimum 6kgs',
          displayOrder: 6,
          isActive: true
        }
      ];

      await Service.insertMany(initialServices);
      console.log('✅ Initial services seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding services:', error);
  }
};

export default Service;
