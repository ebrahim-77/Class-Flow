const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics (role-based)
// @access  Private
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const stats = {};

    if (req.user.role === 'student') {
      // Student stats
      const myBookings = await Booking.countDocuments({ userId: req.user.id });
      const pendingBookings = await Booking.countDocuments({ 
        userId: req.user.id,
        status: 'pending'
      });

      stats.totalBookings = myBookings;
      stats.pendingBookings = pendingBookings;
      stats.upcomingClasses = 0; // Can be implemented with enrollment system
    } 
    else if (req.user.role === 'teacher') {
      // Teacher stats
      const mySchedules = await Schedule.countDocuments({ 
        teacherId: req.user.id,
        isActive: true 
      });
      const myBookings = await Booking.countDocuments({ userId: req.user.id });

      stats.totalClasses = mySchedules;
      stats.totalBookings = myBookings;
      stats.activeSchedules = mySchedules;
    }
    else if (req.user.role === 'admin') {
      // Admin stats
      const pendingBookings = await Booking.countDocuments({ status: 'pending' });
      const totalRooms = await Room.countDocuments();
      const availableRooms = await Room.countDocuments({ status: 'available' });
      const totalSchedules = await Schedule.countDocuments({ isActive: true });

      stats.pendingBookingRequests = pendingBookings;
      stats.totalRooms = totalRooms;
      stats.availableRooms = availableRooms;
      stats.totalSchedules = totalSchedules;
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/dashboard/upcoming-classes
// @desc    Get upcoming classes
// @access  Private
router.get('/upcoming-classes', authenticate, async (req, res, next) => {
  try {
    let classes = [];

    if (req.user.role === 'teacher') {
      classes = await Schedule.find({ 
        teacherId: req.user.id,
        isActive: true 
      })
        .populate('roomId', 'name building')
        .sort({ day: 1, startTime: 1 })
        .limit(5);
    } else if (req.user.role === 'student') {
      // For students, can implement enrollment system
      // For now return sample data or empty
      classes = await Schedule.find({ isActive: true })
        .populate('roomId', 'name building')
        .populate('teacherId', 'name')
        .sort({ day: 1, startTime: 1 })
        .limit(5);
    }

    res.json({
      success: true,
      classes
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
