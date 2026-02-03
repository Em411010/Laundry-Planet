import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);

// Function to seed initial shipping settings
export const seedShippingSettings = async () => {
  try {
    const shippingFeeExists = await Settings.findOne({ key: 'shippingFee' });
    const freeShippingThresholdExists = await Settings.findOne({ key: 'freeShippingThreshold' });

    if (!shippingFeeExists) {
      await Settings.create({
        key: 'shippingFee',
        value: 50,
        description: 'Delivery fee in PHP (applied when weight is below free shipping threshold)'
      });
      console.log('✅ Shipping fee setting created (PHP 50)');
    }

    if (!freeShippingThresholdExists) {
      await Settings.create({
        key: 'freeShippingThreshold',
        value: 4,
        description: 'Minimum weight in kg for free shipping'
      });
      console.log('✅ Free shipping threshold setting created (4 kg)');
    }
  } catch (error) {
    console.error('Error seeding shipping settings:', error);
  }
};

export default Settings;
