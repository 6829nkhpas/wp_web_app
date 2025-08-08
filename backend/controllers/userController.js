import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import EmailService from '../utils/emailService.js';

const emailService = new EmailService();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Register User
export const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, phoneNumber, email } = req.body;

    // Format phone number as wa_id (remove any formatting)
    const wa_id = phoneNumber.replace(/[^\d]/g, '');

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { phoneNumber: wa_id },
        { wa_id: wa_id },
        ...(email ? [{ email }] : [])
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this phone number or email'
      });
    }

    // Create new user
    const user = await User.create({
      name: name.trim(),
      phoneNumber: wa_id,
      wa_id: wa_id,
      email: email?.trim().toLowerCase(),
      isVerified: !email // Auto-verify if no email provided
    });

    // Generate JWT token
    const token = generateToken(user._id);

    // Send welcome email if email provided
    if (email) {
      try {
        await emailService.sendWelcomeEmail(email, name, phoneNumber);
      } catch (emailError) {
        console.warn('Warning: Could not send welcome email:', emailError);
      }
    }

    // Return user data (excluding sensitive info)
    const userData = {
      _id: user._id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      wa_id: user.wa_id,
      email: user.email,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userData,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login User
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phoneNumber } = req.body;
    const wa_id = phoneNumber.replace(/[^\d]/g, '');

    // Find user by phone number or wa_id
    const user = await User.findOne({
      $or: [
        { phoneNumber: wa_id },
        { wa_id: wa_id }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found with this phone number'
      });
    }

    // Update last seen and online status
    user.lastSeen = new Date();
    user.isOnline = true;
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data
    const userData = {
      _id: user._id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      wa_id: user.wa_id,
      email: user.email,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
      lastSeen: user.lastSeen,
      isOnline: user.isOnline,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: 'Login successful',
      user: userData,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Current User Profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update User Profile
export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, profileImage } = req.body;
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (profileImage) updateData.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get All Users (for contact list)
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search;

    const query = { _id: { $ne: req.userId } }; // Exclude current user

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { wa_id: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('name phoneNumber wa_id profileImage lastSeen isOnline')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout User
export const logout = async (req, res) => {
  try {
    // Update user online status
    await User.findByIdAndUpdate(req.userId, {
      isOnline: false,
      lastSeen: new Date()
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
