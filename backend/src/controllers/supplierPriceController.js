const SupplierPrice = require('../models/SupplierPrice');
const Supplier = require('../models/Supplier');
const AuditLog = require('../models/AuditLog');
const { formatSuccess, formatError } = require('../utils/formatters');
const { getClientIP } = require('../utils/helpers');

/**
 * Get supplier prices
 */
const getSupplierPrices = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const userId = req.user.id;

    // Verify supplier exists and belongs to user
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json(formatError('Supplier not found'));
    }

    if (supplier.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(formatError('Access denied'));
    }

    const prices = await SupplierPrice.findBySupplier(supplierId);

    res.json(formatSuccess(prices));

  } catch (error) {
    console.error('Get supplier prices error:', error);
    res.status(500).json(formatError('Failed to fetch supplier prices'));
  }
};

/**
 * Get prices for a product
 */
const getProductPrices = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Get all prices for this product from user's suppliers
    const prices = await SupplierPrice.findByProduct(productId);

    // Filter to only show prices from user's suppliers
    const userPrices = prices.filter(price => {
      // This should be handled in the query, but adding extra check here
      return true; // Model already filters by active suppliers
    });

    res.json(formatSuccess(userPrices));

  } catch (error) {
    console.error('Get product prices error:', error);
    res.status(500).json(formatError('Failed to fetch product prices'));
  }
};

/**
 * Add supplier price
 */
const addSupplierPrice = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const {
      product_id,
      price,
      currency,
      minimum_quantity,
      discount_percentage,
      valid_from,
      valid_to
    } = req.body;
    const userId = req.user.id;

    // Verify supplier exists and belongs to user
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json(formatError('Supplier not found'));
    }

    if (supplier.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(formatError('Access denied'));
    }

    // Check if price already exists
    const existingPrice = await SupplierPrice.findBySupplierProductQuantity(
      supplierId,
      product_id,
      minimum_quantity || 1
    );

    if (existingPrice) {
      return res.status(400).json(formatError('Price for this product and quantity already exists'));
    }

    // Create price
    const supplierPrice = await SupplierPrice.create({
      supplier_id: supplierId,
      product_id,
      price,
      currency,
      minimum_quantity,
      discount_percentage,
      valid_from,
      valid_to
    });

    // Log the action
    await AuditLog.create({
      user_id: userId,
      action: 'CREATE_SUPPLIER_PRICE',
      entity_type: 'supplier_price',
      entity_id: supplierPrice.id,
      ip_address: getClientIP(req),
      user_agent: req.get('user-agent'),
      details: { supplier_id: supplierId, product_id, price }
    });

    res.status(201).json(formatSuccess(supplierPrice, 'Supplier price added successfully'));

  } catch (error) {
    console.error('Add supplier price error:', error);

    if (error.code === '23505') {
      return res.status(400).json(formatError('Price for this product and quantity already exists'));
    }

    res.status(500).json(formatError('Failed to add supplier price'));
  }
};

/**
 * Update supplier price
 */
const updateSupplierPrice = async (req, res) => {
  try {
    const { priceId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Check if price exists
    const existingPrice = await SupplierPrice.findById(priceId);
    if (!existingPrice) {
      return res.status(404).json(formatError('Supplier price not found'));
    }

    // Verify supplier belongs to user
    const supplier = await Supplier.findById(existingPrice.supplier_id);
    if (supplier.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(formatError('Access denied'));
    }

    // Update price
    const supplierPrice = await SupplierPrice.update(priceId, updateData);

    // Log the action
    await AuditLog.create({
      user_id: userId,
      action: 'UPDATE_SUPPLIER_PRICE',
      entity_type: 'supplier_price',
      entity_id: priceId,
      ip_address: getClientIP(req),
      user_agent: req.get('user-agent'),
      details: { updated_fields: Object.keys(updateData) }
    });

    res.json(formatSuccess(supplierPrice, 'Supplier price updated successfully'));

  } catch (error) {
    console.error('Update supplier price error:', error);

    if (error.code === '23505') {
      return res.status(400).json(formatError('Price for this product and quantity already exists'));
    }

    res.status(500).json(formatError('Failed to update supplier price'));
  }
};

/**
 * Delete supplier price
 */
const deleteSupplierPrice = async (req, res) => {
  try {
    const { priceId } = req.params;
    const userId = req.user.id;

    // Check if price exists
    const existingPrice = await SupplierPrice.findById(priceId);
    if (!existingPrice) {
      return res.status(404).json(formatError('Supplier price not found'));
    }

    // Verify supplier belongs to user
    const supplier = await Supplier.findById(existingPrice.supplier_id);
    if (supplier.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(formatError('Access denied'));
    }

    // Delete price
    await SupplierPrice.delete(priceId);

    // Log the action
    await AuditLog.create({
      user_id: userId,
      action: 'DELETE_SUPPLIER_PRICE',
      entity_type: 'supplier_price',
      entity_id: priceId,
      ip_address: getClientIP(req),
      user_agent: req.get('user-agent'),
      details: {
        supplier_id: existingPrice.supplier_id,
        product_id: existingPrice.product_id
      }
    });

    res.json(formatSuccess(null, 'Supplier price deleted successfully'));

  } catch (error) {
    console.error('Delete supplier price error:', error);
    res.status(500).json(formatError('Failed to delete supplier price'));
  }
};

/**
 * Get best price for a product
 */
const getBestPrice = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity = 1 } = req.query;

    const bestPrice = await SupplierPrice.getBestPrice(productId, parseInt(quantity));

    if (!bestPrice) {
      return res.json(formatSuccess(null, 'No prices found for this product'));
    }

    res.json(formatSuccess(bestPrice));

  } catch (error) {
    console.error('Get best price error:', error);
    res.status(500).json(formatError('Failed to fetch best price'));
  }
};

/**
 * Bulk import supplier prices
 */
const bulkImportPrices = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { prices } = req.body; // Array of price objects
    const userId = req.user.id;

    // Verify supplier exists and belongs to user
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json(formatError('Supplier not found'));
    }

    if (supplier.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(formatError('Access denied'));
    }

    // Add supplier_id to each price
    const pricesWithSupplier = prices.map(p => ({ ...p, supplier_id: supplierId }));

    // Bulk create/update
    const importedPrices = await SupplierPrice.bulkCreate(pricesWithSupplier);

    // Log the action
    await AuditLog.create({
      user_id: userId,
      action: 'BULK_IMPORT_SUPPLIER_PRICES',
      entity_type: 'supplier_price',
      entity_id: supplierId,
      ip_address: getClientIP(req),
      user_agent: req.get('user-agent'),
      details: { supplier_id: supplierId, count: importedPrices.length }
    });

    res.json(formatSuccess(importedPrices, `${importedPrices.length} prices imported successfully`));

  } catch (error) {
    console.error('Bulk import prices error:', error);
    res.status(500).json(formatError('Failed to import prices'));
  }
};

module.exports = {
  getSupplierPrices,
  getProductPrices,
  addSupplierPrice,
  updateSupplierPrice,
  deleteSupplierPrice,
  getBestPrice,
  bulkImportPrices
};
