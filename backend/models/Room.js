const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    unique: true,
    trim: true
  },
  building: {
    type: String,
    required: [true, 'Building is required'],
    trim: true
  },
  floor: {
    type: String,
    required: [true, 'Floor is required'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  features: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance'],
    default: 'available'
  }
}, {
  timestamps: true
});

// Indexes
roomSchema.index({ name: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ building: 1 });

module.exports = mongoose.model('Room', roomSchema);
