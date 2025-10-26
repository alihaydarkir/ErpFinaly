const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// Admin only routes
router.get('/users', authMiddleware, rbacMiddleware('admin'), async (req, res) => {
  res.json({ message: 'Get all users - TODO: Implement' });
});

router.get('/stats', authMiddleware, rbacMiddleware('admin'), async (req, res) => {
  res.json({ message: 'Get admin stats - TODO: Implement' });
});

module.exports = router;

