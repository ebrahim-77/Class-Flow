const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherName: {
    type: String,
    required: true,
    trim: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  roomName: {
    type: String,
    required: true,
    trim: true
  },
  // Specific date for the schedule
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  // Day of week (derived from date, kept for convenience)
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: [true, 'Day is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
  },
  duration: {
    type: Number,
    min: 0.5
  },
  color: {
    type: String,
    default: 'bg-blue-500'
  },
  semester: {
    type: String,
    trim: true
  },
  academicYear: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
scheduleSchema.index({ teacherId: 1, date: 1 });
scheduleSchema.index({ roomId: 1, date: 1 });
scheduleSchema.index({ date: 1, startTime: 1 });
scheduleSchema.index({ isActive: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
