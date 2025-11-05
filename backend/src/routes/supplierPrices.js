const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { validate, supplierPriceSchemas } = require('../utils/validators');
const {
  getSupplierPrices,
  getProductPrices,
  addSupplierPrice,
  updateSupplierPrice,
  deleteSupplierPrice,
  getBestPrice,
  bulkImportPrices
} = require('../controllers/supplierPriceController');

// All supplier price endpoints require authentication
router.get('/suppliers/:supplierId/prices', authMiddleware, getSupplierPrices);
router.get('/products/:productId/prices', authMiddleware, getProductPrices);
router.get('/products/:productId/best-price', authMiddleware, getBestPrice);
router.post('/suppliers/:supplierId/prices', authMiddleware, validate(supplierPriceSchemas.create), addSupplierPrice);
router.post('/suppliers/:supplierId/prices/bulk', authMiddleware, validate(supplierPriceSchemas.bulkImport), bulkImportPrices);
router.put('/prices/:priceId', authMiddleware, validate(supplierPriceSchemas.update), updateSupplierPrice);
router.delete('/prices/:priceId', authMiddleware, deleteSupplierPrice);

module.exports = router;
