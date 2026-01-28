const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Room = require('../models/Room');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { validateSchedule } = require('../middleware/validators');

// Helper function to calculate duration
const calculateDuration = (startTime, endTime) => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60;
};

// Helper function to get day name from date
const getDayName = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(date).getDay()];
};

// Helper function to check schedule conflict (now date-based)
const checkConflict = async (roomId, date, startTime, endTime, excludeId = null) => {
  const scheduleDate = new Date(date);
  scheduleDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(scheduleDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const filter = {
    roomId,
    date: {
      $gte: scheduleDate,
      $lt: nextDay
    },
    isActive: true
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const existingSchedules = await Schedule.find(filter);

  for (const schedule of existingSchedules) {
    // Check for time overlap
    if (
      (startTime >= schedule.startTime && startTime < schedule.endTime) ||
      (endTime > schedule.startTime && endTime <= schedule.endTime) ||
      (startTime <= schedule.startTime && endTime >= schedule.endTime)
    ) {
      return true;
    }
  }

  return false;
};

// @route   POST /api/schedules
// @desc    Create new schedule
// @access  Private (Teacher only)
router.post('/', authenticate, authorize('teacher', 'admin'), validateSchedule, async (req, res, next) => {
  try {
    const { courseName, roomId, date, startTime, endTime, color, semester, academicYear } = req.body;

    // Validate date is provided
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Verify room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check for conflicts
    const hasConflict = await checkConflict(roomId, date, startTime, endTime);
    if (hasConflict) {
      return res.status(400).json({
        success: false,
        message: 'Schedule conflict: Room is already booked for this time slot on this date'
      });
    }

    // Calculate duration
    const duration = calculateDuration(startTime, endTime);

    // Get day name from date
    const day = getDayName(date);

    const schedule = await Schedule.create({
      courseName,
      teacherId: req.user.id,
      teacherName: req.user.name,
      roomId,
      roomName: room.name,
      date: new Date(date),
      day,
      startTime,
      endTime,
      duration,
      color: color || 'bg-blue-500',
      semester,
      academicYear
    });

    res.status(201).json({
      success: true,
      schedule
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/schedules
// @desc    Get all schedules
// @access  Private
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { day, roomId, teacherId } = req.query;
    const filter = { isActive: true };

    if (day) filter.day = day;
    if (roomId) filter.roomId = roomId;
    if (teacherId) filter.teacherId = teacherId;

    const schedules = await Schedule.find(filter)
      .populate('teacherId', 'name email')
      .populate('roomId', 'name building capacity')
      .sort({ day: 1, startTime: 1 });

    res.json({
      success: true,
      count: schedules.length,
      schedules
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/schedules/my-classes
// @desc    Get current user's classes
// @access  Private (Teacher/Student)
router.get('/my-classes', authenticate, async (req, res, next) => {
  try {
    let schedules;

    if (req.user.role === 'teacher') {
      schedules = await Schedule.find({ 
        teacherId: req.user.id,
        isActive: true 
      })
        .populate('roomId', 'name building capacity')
        .sort({ day: 1, startTime: 1 });
    } else {
      // For students, you might want to implement enrollment system
      // For now, return empty array
      schedules = [];
    }

    res.json({
      success: true,
      count: schedules.length,
      schedules
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/schedules/timetable
// @desc    Get combined schedules and bookings for timetable view
// @access  Private
router.get('/timetable', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build schedule filter - filter by date range if provided
    let scheduleFilter = { isActive: true };
    if (startDate && endDate) {
      scheduleFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get schedules within date range
    const schedules = await Schedule.find(scheduleFilter)
      .populate('teacherId', 'name email')
      .populate('roomId', 'name building capacity')
      .sort({ date: 1, startTime: 1 });

    // Get approved bookings within date range
    const Booking = require('../models/Booking');
    let bookingFilter = { status: 'approved' };
    
    if (startDate && endDate) {
      bookingFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const bookings = await Booking.find(bookingFilter)
      .populate('userId', 'name email role')
      .populate('roomId', 'name building capacity')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      schedules,
      bookings
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/schedules/upcoming
// @desc    Get upcoming classes
// @access  Private
router.get('/upcoming', authenticate, async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filter = { 
      isActive: true,
      date: { $gte: today }
    };
    
    if (req.user.role === 'teacher') {
      filter.teacherId = req.user.id;
    }

    const schedules = await Schedule.find(filter)
      .populate('roomId', 'name building')
      .sort({ date: 1, startTime: 1 })
      .limit(5);

    res.json({
      success: true,
      schedules
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/schedules/:id
// @desc    Update schedule
// @access  Private (Teacher/Admin)
router.put('/:id', authenticate, authorize('teacher', 'admin'), validateSchedule, async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Teachers can only update their own schedules
    if (req.user.role === 'teacher' && schedule.teacherId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this schedule'
      });
    }

    const { roomId, date, startTime, endTime } = req.body;

    // If date is being updated, derive the day from it
    if (date) {
      req.body.day = getDayName(new Date(date));
    }

    // Check for conflicts if time/room/date changed
    if (roomId || date || startTime || endTime) {
      const hasConflict = await checkConflict(
        roomId || schedule.roomId,
        date || schedule.date,
        startTime || schedule.startTime,
        endTime || schedule.endTime,
        schedule._id
      );

      if (hasConflict) {
        return res.status(400).json({
          success: false,
          message: 'Schedule conflict: Room is already booked for this time slot'
        });
      }
    }

    // Update room name if room changed
    if (roomId) {
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }
      req.body.roomName = room.name;
    }

    // Recalculate duration if times changed
    if (startTime || endTime) {
      const newStartTime = startTime || schedule.startTime;
      const newEndTime = endTime || schedule.endTime;
      req.body.duration = calculateDuration(newStartTime, newEndTime);
    }

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      schedule: updatedSchedule
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/schedules/:id
// @desc    Delete schedule
// @access  Private (Teacher/Admin)
router.delete('/:id', authenticate, authorize('teacher', 'admin'), async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Teachers can only delete their own schedules
    if (req.user.role === 'teacher' && schedule.teacherId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this schedule'
      });
    }

    await Schedule.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/schedules/check-conflict
// @desc    Check for scheduling conflicts and suggest available slots
// @access  Private (Teacher)
router.post('/check-conflict', authenticate, authorize('teacher', 'admin'), async (req, res, next) => {
  try {
    const { roomId, date, startTime, endTime, excludeId } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required for conflict checking'
      });
    }

    const hasConflict = await checkConflict(roomId, date, startTime, endTime, excludeId);
    
    let suggestedSlots = [];
    
    if (hasConflict) {
      // Get all schedules for this room and date
      const dateObj = new Date(date);
      const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
      const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));
      
      const existingSchedules = await Schedule.find({
        roomId,
        date: { $gte: startOfDay, $lte: endOfDay },
        isActive: true
      }).sort({ startTime: 1 });
      
      // Generate available time slots (8 AM to 5 PM)
      const allSlots = [];
      for (let hour = 8; hour < 17; hour++) {
        allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
        allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
      allSlots.push('17:00');
      
      // Calculate requested duration
      const requestedDuration = calculateDuration(startTime, endTime);
      
      // Find free slots that can accommodate the requested duration
      for (let i = 0; i < allSlots.length - 1; i++) {
        const slotStart = allSlots[i];
        // Find end time based on requested duration
        const slotEndIndex = i + (requestedDuration * 2); // 2 slots per hour
        if (slotEndIndex < allSlots.length) {
          const slotEnd = allSlots[slotEndIndex];
          
          // Check if this slot is free
          const slotConflict = await checkConflict(roomId, date, slotStart, slotEnd, excludeId);
          if (!slotConflict) {
            suggestedSlots.push({
              startTime: slotStart,
              endTime: slotEnd
            });
            // Limit to 5 suggestions
            if (suggestedSlots.length >= 5) break;
          }
        }
      }
    }

    res.json({
      success: true,
      hasConflict,
      suggestedSlots
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
