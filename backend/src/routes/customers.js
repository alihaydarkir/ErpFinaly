const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { validate, customerSchemas, querySchemas } = require('../utils/validators');
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');

// All customer endpoints require authentication
router.get('/', authMiddleware, validate(querySchemas.customerFilters, 'query'), getAllCustomers);
router.get('/:id', authMiddleware, getCustomerById);
router.post('/', authMiddleware, validate(customerSchemas.create), createCustomer);
router.put('/:id', authMiddleware, validate(customerSchemas.update), updateCustomer);
router.delete('/:id', authMiddleware, deleteCustomer);

module.exports = router;
