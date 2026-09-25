import { verifyJwt } from '../utils/jwt.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing.',
    });
  }

  const decoded = verifyJwt(token);

  if (!decoded || !decoded.id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid or expired.',
    });
  }

  try {
    // Load user from MongoDB to check active status and role
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Access denied.',
      });
    }

    // Attach authenticated user and user ID to req
    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (err) {
    console.error('Error in protect middleware:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
    });
  }
};

export const protectOwner = async (req, res, next) => {
  await protect(req, res, () => {
    if (!req.user || req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Owner access required.',
      });
    }
    next();
  });
};


