const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Placeholder endpoints
router.post('/message', authMiddleware, async (req, res) => {
  res.json({ message: 'Send chat message - TODO: Implement' });
});

router.get('/history', authMiddleware, async (req, res) => {
  res.json({ message: 'Get chat history - TODO: Implement' });
});

router.post('/rag', authMiddleware, async (req, res) => {
  res.json({ message: 'RAG retrieval - TODO: Implement' });
});

module.exports = router;

