const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Schedule = require('../models/Schedule');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRoom } = require('../middleware/validators');

// @route   POST /api/rooms
// @desc    Create new room
// @access  Private (Admin only)
router.post('/', authenticate, authorize('admin'), validateRoom, async (req, res, next) => {
  try {
    const room = await Room.create(req.body);

    res.status(201).json({
      success: true,
      room
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/rooms
// @desc    Get all rooms
// @access  Private
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, building } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (building) filter.building = building;

    const rooms = await Room.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      count: rooms.length,
      rooms
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/rooms/:id
// @desc    Get room by ID
// @access  Private
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      room
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/rooms/:id
// @desc    Update room
// @access  Private (Admin only)
router.put('/:id', authenticate, authorize('admin'), validateRoom, async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      room
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete room
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/rooms/available/list
// @desc    Get available rooms
// @access  Private
router.get('/available/list', authenticate, async (req, res, next) => {
  try {
    const rooms = await Room.find({ status: 'available' }).sort({ name: 1 });

    res.json({
      success: true,
      count: rooms.length,
      rooms
    });
  } catch (error) {
    next(error);
  }
});

// ==================== HELPER FUNCTIONS ====================

// Helper function to check time overlap
const hasTimeOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && end1 > start2;
};

// Helper function to check if a room is available for a given date/time range
const isRoomAvailableForRange = async (roomId, date, startTime, endTime) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Check existing bookings
  const existingBookings = await Booking.find({
    roomId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'approved'] }
  });

  if (existingBookings.some((booking) => hasTimeOverlap(startTime, endTime, booking.startTime, booking.endTime))) {
    return false;
  }

  // Check existing schedules
  const existingSchedules = await Schedule.find({
    roomId,
    date: { $gte: startOfDay, $lte: endOfDay },
    isActive: true
  });

  return !existingSchedules.some((schedule) => hasTimeOverlap(startTime, endTime, schedule.startTime, schedule.endTime));
};

// ==================== NEW ENDPOINT ====================

// @route   GET /api/rooms/availability
// @desc    Check availability of all rooms for a date/time range
// @access  Private
router.get('/availability', authenticate, async (req, res, next) => {
  try {
    const { date, startTime, endTime, start, end } = req.query;
    const normalizedStartTime = startTime || start;
    const normalizedEndTime = endTime || end;

    // Validate required parameters
    if (!date || !normalizedStartTime || !normalizedEndTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date, start time, and end time'
      });
    }

    // Validate that end time is after start time
    if (normalizedEndTime <= normalizedStartTime) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Fetch all rooms
    const rooms = await Room.find().sort({ building: 1, floor: 1, name: 1 });

    // Check availability for each room
    const roomsWithAvailability = await Promise.all(
      rooms.map(async (room) => {
        const available = await isRoomAvailableForRange(room._id, date, normalizedStartTime, normalizedEndTime);
        return {
          _id: room._id,
          name: room.name,
          building: room.building,
          floor: room.floor,
          capacity: room.capacity,
          features: room.features,
          status: room.status,
          available: available && room.status === 'available' // only "available" if both room status is available AND no conflicts
        };
      })
    );

    res.json({
      success: true,
      count: roomsWithAvailability.length,
      checkedFor: { date, startTime: normalizedStartTime, endTime: normalizedEndTime },
      rooms: roomsWithAvailability
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
