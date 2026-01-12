import User from '../models/User.js';

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      address,
      location
    } = req.body;

    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update basic info
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;

    // Update address
    if (address) {
      user.address = {
        street: address.street || '',
        barangay: address.barangay || '',
        city: address.city || '',
        province: address.province || '',
        zipCode: address.zipCode || '',
        fullAddress: address.fullAddress || ''
      };
    }

    // Update location coordinates
    if (location && location.coordinates) {
      user.location = {
        type: 'Point',
        coordinates: location.coordinates // [longitude, latitude]
      };
    }

    // Check if profile is complete
    const isProfileComplete = !!(
      user.phone &&
      user.address.fullAddress &&
      user.location.coordinates[0] !== 0 &&
      user.location.coordinates[1] !== 0
    );
    
    user.profileComplete = isProfileComplete;

    await user.save();

    const updatedUser = user.toJSON();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Check if profile is complete
export const checkProfileComplete = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('profileComplete phone address location');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const missingFields = [];
    if (!user.phone) missingFields.push('phone');
    if (!user.address?.fullAddress) missingFields.push('address');
    if (user.location?.coordinates[0] === 0 || user.location?.coordinates[1] === 0) {
      missingFields.push('location');
    }

    res.json({
      success: true,
      data: {
        profileComplete: user.profileComplete,
        missingFields
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking profile',
      error: error.message
    });
  }
};
