const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics (role-based)
// @access  Private
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
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
      const totalRooms = await Room.countDocuments();
      const totalSchedules = await Schedule.countDocuments({ isActive: true });
      const totalTeachers = await User.countDocuments({ role: { $regex: '^teacher$', $options: 'i' } });

      const mostUsedRoomResult = await Schedule.aggregate([
        {
          $match: {
            isActive: true,
            $or: [
              { roomId: { $exists: true, $ne: null } },
              { roomName: { $exists: true, $ne: '' } }
            ]
          }
        },
        {
          $group: {
            _id: { $ifNull: ['$roomId', '$roomName'] },
            count: { $sum: 1 },
            roomName: { $first: '$roomName' }
          }
        },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 1 }
      ]);

      const mostUsedRoom = mostUsedRoomResult.length > 0
        ? (mostUsedRoomResult[0].roomName || String(mostUsedRoomResult[0]._id))
        : 'N/A';

      stats.totalRooms = totalRooms;
      stats.totalSchedules = totalSchedules;
      stats.totalTeachers = totalTeachers;
      stats.mostUsedRoom = mostUsedRoom;

      return res.json({
        success: true,
        totalRooms,
        totalSchedules,
        totalTeachers,
        mostUsedRoom,
        stats: {
          totalRooms,
          totalSchedules,
          totalTeachers,
          mostUsedRoom
        }
      });
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      message: 'Failed to load analytics'
    });
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
