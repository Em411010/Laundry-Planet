import Settings from '../models/Settings.js';

// Get a specific setting
export const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await Settings.findOne({ key });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: `Setting '${key}' not found`
      });
    }

    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Error getting setting:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving setting'
    });
  }
};

// Get all settings
export const getAllSettings = async (req, res) => {
  try {
    const settings = await Settings.find().populate('updatedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting all settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving settings'
    });
  }
};

// Get shipping settings specifically
export const getShippingSettings = async (req, res) => {
  try {
    const shippingFee = await Settings.findOne({ key: 'shippingFee' });
    const freeShippingThreshold = await Settings.findOne({ key: 'freeShippingThreshold' });

    res.status(200).json({
      success: true,
      data: {
        shippingFee: shippingFee ? shippingFee.value : 50,
        freeShippingThreshold: freeShippingThreshold ? freeShippingThreshold.value : 4
      }
    });
  } catch (error) {
    console.error('Error getting shipping settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving shipping settings'
    });
  }
};

// Update a setting
export const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        message: 'Value is required'
      });
    }

    const setting = await Settings.findOneAndUpdate(
      { key },
      { 
        value,
        updatedBy: req.userId
      },
      { new: true, upsert: true }
    ).populate('updatedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Setting updated successfully',
      data: setting
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating setting'
    });
  }
};

// Calculate shipping fee based on weight
export const calculateShippingFee = async (weight) => {
  try {
    const shippingFee = await Settings.findOne({ key: 'shippingFee' });
    const freeShippingThreshold = await Settings.findOne({ key: 'freeShippingThreshold' });

    const fee = shippingFee ? shippingFee.value : 50;
    const threshold = freeShippingThreshold ? freeShippingThreshold.value : 4;

    // Free shipping if weight >= threshold
    if (weight >= threshold) {
      return 0;
    }

    return fee;
  } catch (error) {
    console.error('Error calculating shipping fee:', error);
    // Return default values if error
    return weight >= 4 ? 0 : 50;
  }
};
