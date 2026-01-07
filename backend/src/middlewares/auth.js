import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verify JWT token
export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid authentication' 
      });
    }

    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Invalid authentication',
      error: error.message 
    });
  }
};

// Check if user has required role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }
    next();
  };
};
