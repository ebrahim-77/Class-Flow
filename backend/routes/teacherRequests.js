const express = require('express');
const router = express.Router();
const TeacherRequest = require('../models/TeacherRequest');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { validateTeacherRequest } = require('../middleware/validators');

// @route   POST /api/teacher-requests
// @desc    Submit teacher role request
// @access  Private (Student only)
router.post('/', authenticate, authorize('student'), validateTeacherRequest, async (req, res, next) => {
  try {
    const { department, reason } = req.body;

    // Check if user already has a pending or approved request
    const existingRequest = await TeacherRequest.findOne({
      userId: req.user.id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending or approved request'
      });
    }

    const request = await TeacherRequest.create({
      userId: req.user.id,
      name: req.user.name,
      email: req.user.email,
      department,
      reason
    });

    // Update user's teacher request status
    await User.findByIdAndUpdate(req.user.id, {
      teacherRequestStatus: 'pending'
    });

    res.status(201).json({
      success: true,
      request
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/teacher-requests
// @desc    Get all teacher requests
// @access  Private (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const requests = await TeacherRequest.find(filter)
      .populate('userId', 'name email')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/teacher-requests/stats
// @desc    Get teacher request statistics
// @access  Private (Admin only)
router.get('/stats', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const pending = await TeacherRequest.countDocuments({ status: 'pending' });
    const approved = await TeacherRequest.countDocuments({ status: 'approved' });
    const rejected = await TeacherRequest.countDocuments({ status: 'rejected' });
    const total = pending + approved + rejected;

    res.json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/teacher-requests/my-request
// @desc    Get current user's teacher request
// @access  Private
router.get('/my-request', authenticate, async (req, res, next) => {
  try {
    const request = await TeacherRequest.findOne({ userId: req.user.id })
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      request
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/teacher-requests/:id/approve
// @desc    Approve teacher request
// @access  Private (Admin only)
router.put('/:id/approve', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const request = await TeacherRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been reviewed'
      });
    }

    request.status = 'approved';
    request.reviewedAt = Date.now();
    request.reviewedBy = req.user.id;
    await request.save();

    // Update user role to teacher
    await User.findByIdAndUpdate(request.userId, {
      role: 'teacher',
      teacherRequestStatus: 'approved'
    });

    res.json({
      success: true,
      request
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/teacher-requests/:id/reject
// @desc    Reject teacher request
// @access  Private (Admin only)
router.put('/:id/reject', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const request = await TeacherRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been reviewed'
      });
    }

    request.status = 'rejected';
    request.reviewedAt = Date.now();
    request.reviewedBy = req.user.id;
    await request.save();

    // Update user's teacher request status
    await User.findByIdAndUpdate(request.userId, {
      teacherRequestStatus: 'rejected'
    });

    res.json({
      success: true,
      request
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
