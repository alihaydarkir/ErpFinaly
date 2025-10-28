const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  validate: false // Disable all validation for proxy compatibility
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  validate: false // Disable all validation for proxy compatibility
});

module.exports = { generalLimiter, strictLimiter };

