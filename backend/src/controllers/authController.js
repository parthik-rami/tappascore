import mongoose from 'mongoose';
import User from '../models/User.js';
import { signJwt } from '../utils/jwt.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Controller to register a new user with Name + Email + Password.
 * Endpoint: POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently unreachable. Please check your network connection or MongoDB Atlas IP whitelist.',
      });
    }

    const { name, email, password, confirmPassword } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your full name.',
      });
    }

    if (!email || !emailRegex.test(String(email).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please login.',
      });
    }

    const user = new User({
      name: cleanName,
      email: cleanEmail,
      password,
    });

    await user.save();

    const token = signJwt({ id: user._id, email: user.email });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        token,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error in register:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating account.',
    });
  }
};

/**
 * Controller to authenticate an existing user with Username/Email + Password.
 * Endpoint: POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, identifier, username, password } = req.body;
    const input = String(identifier || username || email || '').trim();

    if (!input) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your username or email address.',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your password.',
      });
    }

    const escapedInput = input.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const user = await User.findOne({
      $or: [
        { email: input.toLowerCase() },
        { name: new RegExp(`^${escapedInput}$`, 'i') },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.',
      });
    }

    const token = signJwt({ id: user._id, email: user.email });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        id: user._id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        token,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error in login:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to connect to server. Please try again.',
    });
  }
};

