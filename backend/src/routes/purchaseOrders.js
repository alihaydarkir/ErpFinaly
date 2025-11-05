const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { validate, purchaseOrderSchemas, querySchemas } = require('../utils/validators');
const {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  sendPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  deletePurchaseOrder,
  getPendingPurchaseOrders
} = require('../controllers/purchaseOrderController');

// All purchase order endpoints require authentication
router.get('/pending', authMiddleware, getPendingPurchaseOrders);
router.get('/', authMiddleware, validate(querySchemas.purchaseOrderFilters, 'query'), getPurchaseOrders);
router.get('/:id', authMiddleware, getPurchaseOrderById);
router.post('/', authMiddleware, validate(purchaseOrderSchemas.create), createPurchaseOrder);
router.put('/:id', authMiddleware, validate(purchaseOrderSchemas.update), updatePurchaseOrder);
router.post('/:id/send', authMiddleware, sendPurchaseOrder);
router.post('/:id/receive', authMiddleware, validate(purchaseOrderSchemas.receive), receivePurchaseOrder);
router.post('/:id/cancel', authMiddleware, cancelPurchaseOrder);
router.delete('/:id', authMiddleware, deletePurchaseOrder);

module.exports = router;
