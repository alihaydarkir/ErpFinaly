const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');
const chequeController = require('../controllers/chequeController');

// Get all cheques - accessible by all authenticated users
router.get('/', authMiddleware, chequeController.getAllCheques);

// Get cheque statistics - accessible by all authenticated users
router.get('/statistics', authMiddleware, chequeController.getChequeStatistics);

// Get due cheques - accessible by all authenticated users
router.get('/due', authMiddleware, chequeController.getDueCheques);

// Get cheque by ID - accessible by all authenticated users
router.get('/:id', authMiddleware, chequeController.getChequeById);

// Create cheque - requires manager or admin role
router.post('/', authMiddleware, rbacMiddleware('admin', 'manager'), chequeController.createCheque);

// Update cheque - requires manager or admin role
router.put('/:id', authMiddleware, rbacMiddleware('admin', 'manager'), chequeController.updateCheque);

// Update cheque status - requires manager or admin role
router.patch('/:id/status', authMiddleware, rbacMiddleware('admin', 'manager'), chequeController.updateChequeStatus);

// Delete cheque - requires admin role only
router.delete('/:id', authMiddleware, rbacMiddleware('admin'), chequeController.deleteCheque);

module.exports = router;
