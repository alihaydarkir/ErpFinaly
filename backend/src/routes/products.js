const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');
const { validate, productSchemas, querySchemas } = require('../utils/validators');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// All product endpoints now require authentication
router.get('/', authMiddleware, validate(querySchemas.productFilters, 'query'), getAllProducts);
router.get('/:id', authMiddleware, getProductById);
router.post('/', authMiddleware, rbacMiddleware('admin', 'manager'), validate(productSchemas.create), createProduct);
router.put('/:id', authMiddleware, rbacMiddleware('admin', 'manager'), validate(productSchemas.update), updateProduct);
router.delete('/:id', authMiddleware, rbacMiddleware('admin'), deleteProduct);

module.exports = router;

