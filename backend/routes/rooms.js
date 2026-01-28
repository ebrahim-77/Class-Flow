const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
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

module.exports = router;
