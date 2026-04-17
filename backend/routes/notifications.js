const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');

const buildNotificationFilter = (userRole) => {
  if (userRole === 'teacher') {
    return { type: 'admin' };
  }

  if (userRole === 'student') {
    return {
      $or: [
        { type: 'admin' },
        { type: 'schedule' }
      ]
    };
  }

  return { _id: null };
};

// @route   POST /api/notifications/admin
// @desc    Admin broadcast notification
// @access  Private (Admin only)
router.post('/admin', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const notification = await Notification.create({
      message: message.trim(),
      type: 'admin',
      createdBy: req.user.id,
      targetRole: 'all',
      readBy: []
    });

    res.status(201).json({
      success: true,
      notification
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/notifications/schedule
// @desc    Create schedule notification for students
// @access  Private (Teacher/Admin)
router.post('/schedule', authenticate, authorize('teacher', 'admin'), async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const notification = await Notification.create({
      message: message.trim(),
      type: 'schedule',
      createdBy: req.user.id,
      targetRole: 'student',
      readBy: []
    });

    res.status(201).json({
      success: true,
      notification
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/notifications
// @desc    Get notifications for current user role
// @access  Private
router.get('/', authenticate, async (req, res, next) => {
  try {
    const filter = buildNotificationFilter(req.user.role);
    const notifications = await Notification.find(filter)
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .lean();

    const currentUserId = String(req.user.id);
    const notificationsWithRead = notifications.map((notification) => {
      const isRead = (notification.readBy || []).some((id) => String(id) === currentUserId);
      return {
        ...notification,
        isRead
      };
    });

    res.json({
      success: true,
      count: notificationsWithRead.length,
      notifications: notificationsWithRead
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/notifications/read-all
// @desc    Mark all visible notifications as read by current user
// @access  Private
router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    const filter = buildNotificationFilter(req.user.role);

    const result = await Notification.updateMany(
      filter,
      { $addToSet: { readBy: req.user.id } }
    );

    res.json({
      success: true,
      matchedCount: result.matchedCount || result.n || 0,
      modifiedCount: result.modifiedCount || result.nModified || 0
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark notification as read by current user
// @access  Private
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { $addToSet: { readBy: req.user.id } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
