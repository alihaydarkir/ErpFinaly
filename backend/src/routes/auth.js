const express = require('express');
const router = express.Router();
const { generalLimiter, strictLimiter } = require('../middleware/rateLimit');
const authMiddleware = require('../middleware/auth');
const { validate, userSchemas } = require('../utils/validators');
const {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  requestPasswordReset,
  resetPassword
} = require('../controllers/authController');

// Public routes with validation
router.post('/register', strictLimiter, validate(userSchemas.register), register);
router.post('/login', generalLimiter, validate(userSchemas.login), login);
router.post('/refresh', generalLimiter, refreshToken);
router.post('/reset-password-request', generalLimiter, requestPasswordReset);
router.post('/reset-password', generalLimiter, resetPassword);

// Protected routes (require authentication)
router.post('/logout', authMiddleware, generalLimiter, logout);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, validate(userSchemas.updateUser), updateProfile);

module.exports = router;

