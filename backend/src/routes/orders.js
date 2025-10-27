const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');
const { validate, orderSchemas, querySchemas } = require('../utils/validators');
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} = require('../controllers/orderController');

// All order endpoints require authentication
router.get('/', authMiddleware, validate(querySchemas.orderFilters, 'query'), getAllOrders);
router.get('/:id', authMiddleware, getOrderById);
router.post('/', authMiddleware, validate(orderSchemas.create), createOrder);
router.put('/:id', authMiddleware, validate(orderSchemas.update), updateOrder);
router.delete('/:id', authMiddleware, rbacMiddleware('admin'), deleteOrder);

module.exports = router;

