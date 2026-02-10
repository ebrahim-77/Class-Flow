const Joi = require('joi');

// User registration validation
exports.validateRegister = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().trim(),
    email: Joi.string().email().required().trim().lowercase(),
    password: Joi.string().min(6).required(),
    department: Joi.string().trim().optional(),
    profilePhoto: Joi.string().optional().allow(null, '')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

// User login validation
exports.validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().trim().lowercase(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

// Teacher request validation
exports.validateTeacherRequest = (req, res, next) => {
  const schema = Joi.object({
    department: Joi.string().required().trim(),
    reason: Joi.string().required().trim().min(10)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

// Room validation
exports.validateRoom = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().trim(),
    building: Joi.string().required().trim(),
    floor: Joi.string().required().trim(),
    capacity: Joi.number().integer().min(1).required(),
    features: Joi.array().items(Joi.string().trim()).optional(),
    status: Joi.string().valid('available', 'occupied', 'maintenance').optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

// Schedule validation
exports.validateSchedule = (req, res, next) => {
  const schema = Joi.object({
    courseName: Joi.string().required().trim(),
    roomId: Joi.string().required(),
    date: Joi.date().required(),
    day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').optional(),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    color: Joi.string().optional(),
    semester: Joi.string().trim().optional(),
    academicYear: Joi.string().trim().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

// Booking validation
exports.validateBooking = (req, res, next) => {
  const schema = Joi.object({
    roomId: Joi.string().required(),
    date: Joi.date().required(),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    purpose: Joi.string().required().trim().min(5)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};
