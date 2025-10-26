const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const logger = require('../middleware/logger');

// Register
const register = async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, passwordHash, role]
    );

    logger.info(`User registered: ${username}`);
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '15m' }
    );

    logger.info(`User logged in: ${username}`);
    res.json({ token, user: { id: user.id, username, role: user.role } });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { register, login };

