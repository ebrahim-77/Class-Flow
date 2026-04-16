const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Schedule = require('../models/Schedule');
const Room = require('../models/Room');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validators');

// Helper function to check time overlap
const hasTimeOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && end1 > start2;
};

const isRoomAvailableForRange = async (roomId, date, startTime, endTime, excludeBookingId = null) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const bookingFilter = {
    roomId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $in: ['pending', 'approved'] }
  };

  if (excludeBookingId) {
    bookingFilter._id = { $ne: excludeBookingId };
  }

  const existingBookings = await Booking.find(bookingFilter);
  if (existingBookings.some((booking) => hasTimeOverlap(startTime, endTime, booking.startTime, booking.endTime))) {
    return false;
  }

  const existingSchedules = await Schedule.find({
    roomId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    isActive: true
  });

  return !existingSchedules.some((schedule) => hasTimeOverlap(startTime, endTime, schedule.startTime, schedule.endTime));
};

const findAvailableRooms = async (date, startTime, endTime, excludeRoomId = null, excludeBookingId = null) => {
  const rooms = await Room.find({ status: 'available' }).sort({ building: 1, name: 1 });
  const availableRooms = [];

  for (const room of rooms) {
    if (excludeRoomId && room._id.toString() === excludeRoomId.toString()) {
      continue;
    }

    const isAvailable = await isRoomAvailableForRange(room._id, date, startTime, endTime, excludeBookingId);
    if (isAvailable) {
      availableRooms.push(room);
    }

    if (availableRooms.length >= 5) {
      break;
    }
  }

  return availableRooms;
};

// Helper function to calculate duration in hours
const calculateDuration = (startTime, endTime) => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60;
};

// Helper function to check booking conflict (against both bookings AND schedules)
const checkBookingConflict = async (roomId, date, startTime, endTime, excludeBookingId = null) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Check existing bookings
  const bookingFilter = {
    roomId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $in: ['pending', 'approved'] }
  };

  if (excludeBookingId) {
    bookingFilter._id = { $ne: excludeBookingId };
  }

  const existingBookings = await Booking.find(bookingFilter);

  for (const booking of existingBookings) {
    if (hasTimeOverlap(startTime, endTime, booking.startTime, booking.endTime)) {
      return { hasConflict: true, conflictType: 'booking', conflictWith: booking };
    }
  }

  // Check existing schedules
  const scheduleFilter = {
    roomId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    isActive: true
  };

  const existingSchedules = await Schedule.find(scheduleFilter);

  for (const schedule of existingSchedules) {
    if (hasTimeOverlap(startTime, endTime, schedule.startTime, schedule.endTime)) {
      return { hasConflict: true, conflictType: 'schedule', conflictWith: schedule };
    }
  }

  return { hasConflict: false, conflictType: null, conflictWith: null };
};

// Helper function to get all occupied slots for a room on a date
const getOccupiedSlots = async (roomId, date, excludeBookingId = null) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const occupiedSlots = [];

  // Get bookings
  const bookingFilter = {
    roomId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'approved'] }
  };
  if (excludeBookingId) {
    bookingFilter._id = { $ne: excludeBookingId };
  }

  const bookings = await Booking.find(bookingFilter);
  bookings.forEach(b => occupiedSlots.push({ start: b.startTime, end: b.endTime }));

  // Get schedules
  const schedules = await Schedule.find({
    roomId,
    date: { $gte: startOfDay, $lte: endOfDay },
    isActive: true
  });
  schedules.forEach(s => occupiedSlots.push({ start: s.startTime, end: s.endTime }));

  return occupiedSlots.sort((a, b) => a.start.localeCompare(b.start));
};

// Helper function to find available time slots
const findAvailableSlots = async (roomId, date, requestedDuration, excludeBookingId = null) => {
  const occupiedSlots = await getOccupiedSlots(roomId, date, excludeBookingId);
  
  // Working hours: 8:00 AM to 5:00 PM
  const workStart = '08:00';
  const workEnd = '17:00';
  
  // Generate all possible slots (30-minute increments)
  const allSlots = [];
  for (let hour = 8; hour < 17; hour++) {
    allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  allSlots.push('17:00');

  const availableSlots = [];
  const slotsNeeded = Math.ceil(requestedDuration * 2); // 2 slots per hour

  for (let i = 0; i <= allSlots.length - slotsNeeded; i++) {
    const slotStart = allSlots[i];
    const slotEnd = allSlots[i + slotsNeeded];
    
    if (!slotEnd || slotEnd > workEnd) continue;

    // Check if this slot conflicts with any occupied slot
    let isAvailable = true;
    for (const occupied of occupiedSlots) {
      if (hasTimeOverlap(slotStart, slotEnd, occupied.start, occupied.end)) {
        isAvailable = false;
        break;
      }
    }

    if (isAvailable) {
      availableSlots.push({ startTime: slotStart, endTime: slotEnd });
      if (availableSlots.length >= 5) break; // Limit to 5 suggestions
    }
  }

  return availableSlots;
};

// @route   POST /api/bookings
// @desc    Create new booking request
// @access  Private (Teacher only)
router.post('/', authenticate, authorize('teacher'), validateBooking, async (req, res, next) => {
  try {
    const { roomId, date, startTime, endTime, purpose } = req.body;

    // Verify room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check for conflicts (against both bookings and schedules)
    const { hasConflict, conflictType } = await checkBookingConflict(roomId, date, startTime, endTime);
    if (hasConflict) {
      // Calculate duration and find alternative slots
      const duration = calculateDuration(startTime, endTime);
      const suggestedSlots = await findAvailableSlots(roomId, date, duration);
      
      return res.status(400).json({
        success: false,
        message: `This room is already booked at the selected time${conflictType === 'schedule' ? ' (scheduled class)' : ''}.`,
        hasConflict: true,
        conflictType,
        suggestedSlots,
        noSlotsAvailable: suggestedSlots.length === 0
      });
    }

    // Auto-approve teacher bookings, students need approval
    const status = req.user.role === 'teacher' ? 'approved' : 'pending';

    const booking = await Booking.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      roomId,
      roomName: room.name,
      date,
      startTime,
      endTime,
      purpose,
      status,
      // If teacher, set reviewed fields immediately
      ...(req.user.role === 'teacher' && {
        reviewedAt: Date.now(),
        reviewedBy: req.user.id
      })
    });

    res.status(201).json({
      success: true,
      booking
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/bookings/check-conflict
// @desc    Check for booking conflicts and suggest available slots
// @access  Private (Teacher only)
router.post('/check-conflict', authenticate, authorize('teacher'), async (req, res, next) => {
  try {
    const { roomId, date, startTime, endTime, excludeId } = req.body;

    if (!roomId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Room, date, start time, and end time are required'
      });
    }

    // Validate end time is after start time
    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    const { hasConflict, conflictType } = await checkBookingConflict(roomId, date, startTime, endTime, excludeId);
    
    let suggestedSlots = [];
    let suggestedRooms = [];
    let noSlotsAvailable = false;
    
    if (hasConflict) {
      // Calculate duration and find alternative slots
      const duration = calculateDuration(startTime, endTime);
      suggestedSlots = await findAvailableSlots(roomId, date, duration, excludeId);
      suggestedRooms = await findAvailableRooms(date, startTime, endTime, roomId, excludeId);
      noSlotsAvailable = suggestedSlots.length === 0;
    }

    res.json({
      success: true,
      hasConflict,
      conflictType,
      suggestedSlots,
      suggestedRooms,
      noSlotsAvailable
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bookings
// @desc    Get all bookings (for timetable and admin)
// @access  Private
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filter = {};

    // Admin sees all, others see only approved bookings for timetable
    if (req.user.role !== 'admin') {
      filter.status = 'approved';
    } else if (status) {
      filter.status = status;
    }

    // Date range filter for timetable view
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(filter)
      .populate('userId', 'name email role')
      .populate('roomId', 'name building capacity')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bookings/my-bookings
// @desc    Get current user's bookings
// @access  Private
router.get('/my-bookings', authenticate, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('roomId', 'name building capacity')
      .sort({ date: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('roomId', 'name building capacity');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Users can only view their own bookings unless admin
    if (booking.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/bookings/:id/approve
// @desc    Approve booking (ONLY for student bookings)
// @access  Private (Admin only)
router.put('/:id/approve', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('userId', 'role');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Prevent approving teacher bookings (they should already be approved)
    if (booking.userId.role === 'teacher') {
      return res.status(400).json({
        success: false,
        message: 'Teacher bookings are automatically approved'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking has already been reviewed'
      });
    }

    booking.status = 'approved';
    booking.reviewedAt = Date.now();
    booking.reviewedBy = req.user.id;
    await booking.save();

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/bookings/:id/reject
// @desc    Reject booking (ONLY for student bookings)
// @access  Private (Admin only)
router.put('/:id/reject', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('userId', 'role');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Prevent rejecting teacher bookings
    if (booking.userId.role === 'teacher') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject teacher bookings'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking has already been reviewed'
      });
    }

    booking.status = 'rejected';
    booking.reviewedAt = Date.now();
    booking.reviewedBy = req.user.id;
    await booking.save();

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private
router.put('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Users can only cancel their own bookings
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bookings/stats/summary
// @desc    Get booking statistics
// @access  Private (Admin)
router.get('/stats/summary', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const pending = await Booking.countDocuments({ status: 'pending' });
    const approved = await Booking.countDocuments({ status: 'approved' });
    const rejected = await Booking.countDocuments({ status: 'rejected' });
    const cancelled = await Booking.countDocuments({ status: 'cancelled' });
    const total = pending + approved + rejected + cancelled;

    res.json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected,
        cancelled
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
