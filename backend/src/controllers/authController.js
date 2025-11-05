const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const pool = require('../config/database');
const emailService = require('../services/emailService');
const cacheService = require('../services/cacheService');
const { formatUser, formatSuccess, formatError } = require('../utils/formatters');
const { getClientIP } = require('../utils/helpers');

/**
 * Register new user
 */
const register = async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json(formatError('Email already registered'));
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json(formatError('Username already taken'));
    }

    // Create user
    const user = await User.create({ username, email, password, role });

    // Log activity
    await AuditLog.create({
      user_id: user.id,
      action: 'REGISTER',
      entity_type: 'user',
      entity_id: user.id,
      changes: { username, email, role },
      ip_address: getClientIP(req)
    });

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(user).catch(err =>
      console.error('Welcome email error:', err)
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );

    console.log(`User registered: ${username} (${user.id})`);

    res.status(201).json(formatSuccess({
      user: formatUser(user),
      token,
      refreshToken
    }, 'Registration successful'));

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json(formatError('Registration failed', error.message));
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json(formatError('Invalid credentials'));
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json(formatError('Invalid credentials'));
    }

    // Generate tokens
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );

    // Cache user session
    await cacheService.cacheSession(user.id, {
      userId: user.id,
      username: user.username,
      role: user.role,
      loginAt: new Date()
    });

    // Log activity in audit_logs
    await AuditLog.logLogin(user.id, getClientIP(req));

    // Log login in login_logs table
    const userAgent = req.get('user-agent') || 'Unknown';
    const ipAddress = getClientIP(req);

    // Parse device and browser from user agent
    let device = 'Desktop';
    let browser = 'Unknown';

    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      device = 'Mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      device = 'Tablet';
    }

    if (userAgent.includes('Chrome')) {
      browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'Safari';
    } else if (userAgent.includes('Edge')) {
      browser = 'Edge';
    }

    await pool.query(`
      INSERT INTO login_logs (user_id, ip_address, user_agent, device, browser, location, success)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [user.id, ipAddress, userAgent, device, browser, 'Unknown', true]);

    // Update user last_login and login_count
    await pool.query(`
      UPDATE users
      SET last_login = NOW(), login_count = COALESCE(login_count, 0) + 1
      WHERE id = $1
    `, [user.id]);

    console.log(`User logged in: ${user.username} (${user.id})`);

    res.json(formatSuccess({
      user: formatUser(user),
      token,
      refreshToken
    }, 'Login successful'));

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(formatError('Login failed'));
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json(formatError('Refresh token required'));
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json(formatError('User not found'));
    }

    // Generate new access token
    const newToken = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '15m' }
    );

    res.json(formatSuccess({ token: newToken }, 'Token refreshed'));

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json(formatError('Invalid refresh token'));
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Delete cached session
    await cacheService.deleteSession(userId);

    // Log activity
    await AuditLog.logLogout(userId, getClientIP(req));

    console.log(`User logged out: ${req.user.username} (${userId})`);

    res.json(formatSuccess(null, 'Logout successful'));

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json(formatError('Logout failed'));
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json(formatError('User not found'));
    }

    res.json(formatSuccess(formatUser(user)));

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json(formatError('Failed to get profile'));
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    // Don't allow role update through profile endpoint
    delete updates.role;

    const updatedUser = await User.update(userId, updates);

    // Log activity
    await AuditLog.create({
      user_id: userId,
      action: 'UPDATE',
      entity_type: 'user',
      entity_id: userId,
      changes: updates,
      ip_address: getClientIP(req)
    });

    // Invalidate session cache
    await cacheService.deleteSession(userId);

    console.log(`User profile updated: ${updatedUser.username} (${userId})`);

    res.json(formatSuccess(formatUser(updatedUser), 'Profile updated'));

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json(formatError('Failed to update profile'));
  }
};

/**
 * Request password reset
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return res.json(formatSuccess(null, 'If email exists, reset link has been sent'));
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send reset email
    await emailService.sendPasswordResetEmail(user, resetToken);

    // Log activity
    await AuditLog.create({
      user_id: user.id,
      action: 'PASSWORD_RESET_REQUEST',
      entity_type: 'user',
      entity_id: user.id,
      changes: { email },
      ip_address: getClientIP(req)
    });

    res.json(formatSuccess(null, 'If email exists, reset link has been sent'));

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json(formatError('Failed to process request'));
  }
};

/**
 * Reset password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json(formatError('Invalid reset token'));
    }

    // Update password
    await User.update(decoded.userId, { password: newPassword });

    // Log activity
    await AuditLog.create({
      user_id: decoded.userId,
      action: 'PASSWORD_RESET',
      entity_type: 'user',
      entity_id: decoded.userId,
      changes: { password_changed: true },
      ip_address: getClientIP(req)
    });

    console.log(`Password reset: User ${decoded.userId}`);

    res.json(formatSuccess(null, 'Password reset successful'));

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(400).json(formatError('Invalid or expired reset token'));
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  requestPasswordReset,
  resetPassword
};
