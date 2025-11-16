const express = require('express');
const router = express.Router();
const chequeController = require('../controllers/chequeController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// All routes require authentication
router.use(authenticate);

// Get all cheques - accessible by all authenticated users
router.get('/', chequeController.getAllCheques);

// Get cheque statistics - accessible by all authenticated users
router.get('/statistics', chequeController.getChequeStatistics);

// Get due cheques - accessible by all authenticated users
router.get('/due', chequeController.getDueCheques);

// Get cheque by ID - accessible by all authenticated users
router.get('/:id', chequeController.getChequeById);

// Create cheque - requires manager or admin role
router.post('/', authorize(['admin', 'manager']), chequeController.createCheque);

// Update cheque - requires manager or admin role
router.put('/:id', authorize(['admin', 'manager']), chequeController.updateCheque);

// Update cheque status - requires manager or admin role
router.patch('/:id/status', authorize(['admin', 'manager']), chequeController.updateChequeStatus);

// Delete cheque - requires admin role only
router.delete('/:id', authorize(['admin']), chequeController.deleteCheque);

module.exports = router;
