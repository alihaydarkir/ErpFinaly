const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { validate, supplierSchemas, querySchemas } = require('../utils/validators');
const {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierPerformance,
  searchSuppliers,
  getPerformanceReport
} = require('../controllers/supplierController');

// All supplier endpoints require authentication
router.get('/search', authMiddleware, searchSuppliers);
router.get('/performance/report', authMiddleware, getPerformanceReport);
router.get('/:id/performance', authMiddleware, getSupplierPerformance);
router.get('/', authMiddleware, validate(querySchemas.supplierFilters, 'query'), getAllSuppliers);
router.get('/:id', authMiddleware, getSupplierById);
router.post('/', authMiddleware, validate(supplierSchemas.create), createSupplier);
router.put('/:id', authMiddleware, validate(supplierSchemas.update), updateSupplier);
router.delete('/:id', authMiddleware, deleteSupplier);

module.exports = router;
