const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const { validateSchedule } = require('../middleware/validators');

const degreeRequiresBatch = ['BSc Engg', 'MSc Engg (Regular)', 'MSc Engg (Evening)'];

const isRoomAvailableForRange = async (roomId, date, startTime, endTime, excludeScheduleId = null) => {
  const scheduleDate = new Date(date);
  scheduleDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(scheduleDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const scheduleFilter = {
    roomId,
    date: {
      $gte: scheduleDate,
      $lt: nextDay
    },
    isActive: true
  };

  if (excludeScheduleId) {
    scheduleFilter._id = { $ne: excludeScheduleId };
  }

  const existingSchedules = await Schedule.find(scheduleFilter);
  if (existingSchedules.some((schedule) => hasTimeOverlap(startTime, endTime, schedule.startTime, schedule.endTime))) {
    return false;
  }

  const existingBookings = await Booking.find({
    roomId,
    date: {
      $gte: scheduleDate,
      $lt: nextDay
    },
    status: { $in: ['pending', 'approved'] }
  });

  return !existingBookings.some((booking) => hasTimeOverlap(startTime, endTime, booking.startTime, booking.endTime));
};

const findAvailableRooms = async (date, startTime, endTime, excludeRoomId = null, excludeScheduleId = null) => {
  const rooms = await Room.find({ status: 'available' }).sort({ building: 1, name: 1 });
  const availableRooms = [];

  for (const room of rooms) {
    if (excludeRoomId && room._id.toString() === excludeRoomId.toString()) {
      continue;
    }

    const isAvailable = await isRoomAvailableForRange(room._id, date, startTime, endTime, excludeScheduleId);
    if (isAvailable) {
      availableRooms.push(room);
    }

    if (availableRooms.length >= 5) {
      break;
    }
  }

  return availableRooms;
};

// Helper function to check time overlap
const hasTimeOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && end1 > start2;
};

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

// Helper function to check schedule conflict (against both schedules AND bookings)
const checkConflict = async (roomId, date, startTime, endTime, excludeScheduleId = null) => {
  const scheduleDate = new Date(date);
  scheduleDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(scheduleDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // Check existing schedules
  const scheduleFilter = {
    roomId,
    date: {
      $gte: scheduleDate,
      $lt: nextDay
    },
    isActive: true
  };

  if (excludeScheduleId) {
    scheduleFilter._id = { $ne: excludeScheduleId };
  }

  const existingSchedules = await Schedule.find(scheduleFilter);

  for (const schedule of existingSchedules) {
    if (hasTimeOverlap(startTime, endTime, schedule.startTime, schedule.endTime)) {
      return { hasConflict: true, conflictType: 'schedule', conflictWith: schedule };
    }
  }

  // Check existing bookings (approved and pending)
  const existingBookings = await Booking.find({
    roomId,
    date: {
      $gte: scheduleDate,
      $lt: nextDay
    },
    status: { $in: ['pending', 'approved'] }
  });

  for (const booking of existingBookings) {
    if (hasTimeOverlap(startTime, endTime, booking.startTime, booking.endTime)) {
      return { hasConflict: true, conflictType: 'booking', conflictWith: booking };
    }
  }

  return { hasConflict: false, conflictType: null, conflictWith: null };
};

// Helper function to get all occupied slots for a room on a date
const getOccupiedSlots = async (roomId, date, excludeScheduleId = null) => {
  const scheduleDate = new Date(date);
  scheduleDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(scheduleDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const occupiedSlots = [];

  // Get schedules
  const scheduleFilter = {
    roomId,
    date: { $gte: scheduleDate, $lt: nextDay },
    isActive: true
  };
  if (excludeScheduleId) {
    scheduleFilter._id = { $ne: excludeScheduleId };
  }

  const schedules = await Schedule.find(scheduleFilter);
  schedules.forEach(s => occupiedSlots.push({ start: s.startTime, end: s.endTime }));

  // Get bookings
  const bookings = await Booking.find({
    roomId,
    date: { $gte: scheduleDate, $lt: nextDay },
    status: { $in: ['pending', 'approved'] }
  });
  bookings.forEach(b => occupiedSlots.push({ start: b.startTime, end: b.endTime }));

  return occupiedSlots.sort((a, b) => a.start.localeCompare(b.start));
};

// Helper function to find available time slots
const findAvailableSlots = async (roomId, date, requestedDuration, excludeScheduleId = null) => {
  const occupiedSlots = await getOccupiedSlots(roomId, date, excludeScheduleId);
  
  // Working hours: 8:00 AM to 5:00 PM
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

// @route   POST /api/schedules
// @desc    Create new schedule
// @access  Private (Teacher only)
router.post('/', authenticate, authorize('teacher'), validateSchedule, async (req, res, next) => {
  try {
    const { courseName, roomId, degree, batch, date, startTime, endTime, color, semester, academicYear } = req.body;

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

    // Check for conflicts (against both schedules and bookings)
    const { hasConflict, conflictType } = await checkConflict(roomId, date, startTime, endTime);
    if (hasConflict) {
      // Calculate duration and find alternative slots
      const duration = calculateDuration(startTime, endTime);
      const suggestedSlots = await findAvailableSlots(roomId, date, duration);
      const suggestedRooms = await findAvailableRooms(date, startTime, endTime, roomId);
      
      return res.status(400).json({
        success: false,
        message: `This room is already booked at the selected time${conflictType === 'booking' ? ' (room booking)' : ''}.`,
        hasConflict: true,
        conflictType,
        suggestedSlots,
        suggestedRooms,
        noSlotsAvailable: suggestedSlots.length === 0
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
      degree,
      batch: degreeRequiresBatch.includes(degree) ? batch : undefined,
      date: new Date(date),
      day,
      startTime,
      endTime,
      duration,
      color: color || 'bg-blue-500',
      semester,
      academicYear
    });

    try {
      await Notification.create({
        message: `New class scheduled: ${courseName}`,
        type: 'schedule',
        createdBy: req.user.id,
        targetRole: 'student',
        scheduleId: schedule._id,
        readBy: []
      });
    } catch (notificationError) {
      console.error('Failed to create schedule notification:', notificationError);
    }

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
    const { day, roomId, teacherId, degree, batch, weekStart, weekEnd, date } = req.query;
    const filter = { isActive: true };

    if (day) filter.day = day;
    if (roomId) filter.roomId = roomId;
    if (teacherId) filter.teacherId = teacherId;
    if (degree) filter.degree = degree;

    if (batch && degreeRequiresBatch.includes(degree)) {
      filter.batch = Number(batch);
    }

    // Supports day-specific reads via ?date=YYYY-MM-DD
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      filter.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    } else if (weekStart && weekEnd) {
      filter.date = {
        $gte: new Date(weekStart),
        $lte: new Date(weekEnd)
      };
    }

    const schedules = await Schedule.find(filter)
      .populate('teacherId', 'name email')
      .populate('roomId', 'name building capacity')
      .sort({ date: 1, startTime: 1 });

    const formattedSchedules = schedules.map((schedule) => {
      const scheduleObj = schedule.toObject();
      return {
        ...scheduleObj,
        teacherName: scheduleObj.teacherName || scheduleObj.teacherId?.name || 'Unknown teacher',
        room: scheduleObj.roomName || scheduleObj.roomId?.name || 'Unknown room'
      };
    });

    res.json({
      success: true,
      count: formattedSchedules.length,
      schedules: formattedSchedules
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

    // Check for conflicts if time/room/date changed (against both schedules and bookings)
    if (roomId || date || startTime || endTime) {
      const { hasConflict, conflictType } = await checkConflict(
        roomId || schedule.roomId,
        date || schedule.date,
        startTime || schedule.startTime,
        endTime || schedule.endTime,
        schedule._id
      );

      if (hasConflict) {
        // Calculate duration and find alternative slots
        const newStartTime = startTime || schedule.startTime;
        const newEndTime = endTime || schedule.endTime;
        const duration = calculateDuration(newStartTime, newEndTime);
        const suggestedSlots = await findAvailableSlots(
          roomId || schedule.roomId,
          date || schedule.date,
          duration,
          schedule._id
        );
        
        return res.status(400).json({
          success: false,
          message: `This room is already booked at the selected time${conflictType === 'booking' ? ' (room booking)' : ''}.`,
          hasConflict: true,
          conflictType,
          suggestedSlots,
          noSlotsAvailable: suggestedSlots.length === 0
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

    if (!roomId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Room, start time, and end time are required'
      });
    }

    // Validate end time is after start time
    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    const { hasConflict, conflictType } = await checkConflict(roomId, date, startTime, endTime, excludeId);
    
    let suggestedSlots = [];
    let noSlotsAvailable = false;
    
    if (hasConflict) {
      // Calculate duration and find alternative slots
      const duration = calculateDuration(startTime, endTime);
      suggestedSlots = await findAvailableSlots(roomId, date, duration, excludeId);
      noSlotsAvailable = suggestedSlots.length === 0;
    }

    res.json({
      success: true,
      hasConflict,
      conflictType,
      suggestedSlots,
      noSlotsAvailable
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/schedules/:id/update
// @desc    Update schedule (message update, reschedule, or cancel)
// @access  Private (Teacher/Admin)
router.put('/:id/update', authenticate, authorize('teacher', 'admin'), async (req, res, next) => {
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

    const { type, editMessage, newDate, startTime, endTime } = req.body;

    // Validate type
    if (!type || !['update', 'reschedule', 'cancel'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid update type. Must be "update", "reschedule", or "cancel"'
      });
    }

    let updateData = {};

    // Handle different update types
    if (type === 'cancel') {
      // Cancel the class
      updateData.status = 'cancelled';
      if (editMessage) {
        updateData.editMessage = editMessage;
      }

      const notificationMessage = `Class cancelled: ${schedule.courseName}${editMessage ? ` (${editMessage})` : ''}`;
      await Notification.create({
        message: notificationMessage,
        type: 'schedule',
        createdBy: req.user.id,
        targetRole: 'student',
        scheduleId: schedule._id,
        readBy: []
      });

    } else if (type === 'reschedule') {
      // Reschedule to new date/time
      if (!newDate || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'newDate, startTime, and endTime are required for reschedule'
        });
      }

      // Validate end time is after start time
      if (endTime <= startTime) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }

      // Validate date is not in the past
      const newDateObj = new Date(newDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (newDateObj < today) {
        return res.status(400).json({
          success: false,
          message: 'Cannot reschedule to a past date'
        });
      }

      // Check for conflicts with new date/time
      const { hasConflict, conflictType } = await checkConflict(
        schedule.roomId,
        newDate,
        startTime,
        endTime,
        schedule._id
      );

      if (hasConflict) {
        const duration = calculateDuration(startTime, endTime);
        const suggestedSlots = await findAvailableSlots(
          schedule.roomId,
          newDate,
          duration,
          schedule._id
        );

        return res.status(409).json({
          success: false,
          message: `The room is already booked at the selected time${conflictType === 'booking' ? ' (room booking)' : ''}.`,
          hasConflict: true,
          conflictType,
          suggestedSlots,
          noSlotsAvailable: suggestedSlots.length === 0
        });
      }

      // Update schedule with new date/time
      updateData.date = new Date(newDate);
      updateData.startTime = startTime;
      updateData.endTime = endTime;
      updateData.day = getDayName(new Date(newDate));
      updateData.duration = calculateDuration(startTime, endTime);
      updateData.status = 'rescheduled';
      if (editMessage) {
        updateData.editMessage = editMessage;
      }

      // Format new time for notification
      const newTimeStr = `${startTime} - ${endTime}`;
      const notificationMessage = `Class rescheduled: ${schedule.courseName} → ${newTimeStr}${editMessage ? ` (${editMessage})` : ''}`;
      await Notification.create({
        message: notificationMessage,
        type: 'schedule',
        createdBy: req.user.id,
        targetRole: 'student',
        scheduleId: schedule._id,
        readBy: []
      });

    } else if (type === 'update') {
      // Update message only
      if (editMessage) {
        updateData.editMessage = editMessage;
      }
      // Keep status as is (don't change it for message-only updates)

      const notificationMessage = `Class updated: ${schedule.courseName}${editMessage ? ` - ${editMessage}` : ''}`;
      await Notification.create({
        message: notificationMessage,
        type: 'schedule',
        createdBy: req.user.id,
        targetRole: 'student',
        scheduleId: schedule._id,
        readBy: []
      });
    }

    // Apply updates to schedule
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      schedule: updatedSchedule
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
