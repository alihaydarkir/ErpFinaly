const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} = require('../controllers/orderController');

router.get('/', authMiddleware, getAllOrders);
router.get('/:id', authMiddleware, getOrderById);
router.post('/', authMiddleware, createOrder);
router.put('/:id', authMiddleware, updateOrder);
router.delete('/:id', authMiddleware, deleteOrder);

module.exports = router;

