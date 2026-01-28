const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    // Users can only update their own profile unless admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }

    const { name, department, profilePhoto } = req.body;
    const updateFields = {};
    
    if (name) updateFields.name = name;
    if (department) updateFields.department = department;
    if (profilePhoto !== undefined) updateFields.profilePhoto = profilePhoto;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/users/:id/upload-photo
// @desc    Upload profile photo (base64)
// @access  Private
router.post('/:id/upload-photo', authenticate, async (req, res, next) => {
  try {
    // Users can only update their own photo unless admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }

    const { photo } = req.body;
    
    if (!photo) {
      return res.status(400).json({
        success: false,
        message: 'Photo data is required'
      });
    }

    // Validate that it's a base64 image
    if (!photo.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Please upload a valid image.'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { profilePhoto: photo },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
