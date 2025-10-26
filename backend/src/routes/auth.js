const express = require('express');
const router = express.Router();
const { generalLimiter, strictLimiter } = require('../middleware/rateLimit');
const { register, login } = require('../controllers/authController');

router.post('/register', strictLimiter, register);
router.post('/login', generalLimiter, login);

router.post('/refresh', generalLimiter, async (req, res) => {
  res.json({ message: 'Refresh endpoint - TODO: Implement' });
});

router.post('/logout', generalLimiter, async (req, res) => {
  res.json({ message: 'Logout endpoint - TODO: Implement' });
});

module.exports = router;

