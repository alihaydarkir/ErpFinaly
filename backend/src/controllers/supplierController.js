const Supplier = require('../models/Supplier');
const AuditLog = require('../models/AuditLog');
const { formatSuccess, formatError, formatPaginated } = require('../utils/formatters');
const { getClientIP, calculateOffset } = require('../utils/helpers');

/**
 * Get all suppliers
 */
const getAllSuppliers = async (req, res) => {
  try {
    const { search, page = 1, limit = 50, offset, is_active } = req.query;
    const userId = req.user.id;

    // Build filters
    const filters = {
      user_id: userId,
      search,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      limit: parseInt(limit),
      offset: offset ? parseInt(offset) : calculateOffset(parseInt(page), parseInt(limit))
    };

    const suppliers = await Supplier.findAll(filters);
    const total = await Supplier.count({ user_id: userId, search, is_active: filters.is_active });

    const result = formatPaginated(
      suppliers,
      total,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);

  } catch (error) {
    console.error('Get all suppliers error:', error);
    res.status(500).json(formatError('Failed to fetch suppliers'));
  }
};

/**
 * Get supplier by ID
 */
const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json(formatError('Supplier not found'));
    }

    // Check if supplier belongs to user
    if (supplier.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(formatError('Access denied'));
    }

    res.json(formatSuccess(supplier));

  } catch (error) {
    console.error('Get supplier by ID error:', error);
    res.status(500).json(formatError('Failed to fetch supplier'));
  }
};

/**
 * Create a new supplier
 */
const createSupplier = async (req, res) => {
  try {
    const {
      company_name,
      contact_name,
      email,
      tax_number,
      phone_number,
      location,
      payment_terms,
      lead_time_days,
      min_order_quantity,
      risk_level,
      website,
      notes,
      is_active,
      rating
    } = req.body;

    const userId = req.user.id;

    // Check if supplier with same tax number already exists for this user
    const existingSupplier = await Supplier.findByTaxNumber(tax_number, userId);
    if (existingSupplier) {
      return res.status(400).json(formatError('A supplier with this tax number already exists'));
    }

    // Create supplier
    const supplier = await Supplier.create({
      user_id: userId,
      company_name,
      contact_name,
      email,
      tax_number,
      phone_number,
      location,
      payment_terms,
      lead_time_days,
      min_order_quantity,
      risk_level,
      website,
      notes,
      is_active,
      rating
    });

    // Log the action
    await AuditLog.create({
      user_id: userId,
      action: 'CREATE_SUPPLIER',
      entity_type: 'supplier',
      entity_id: supplier.id,
      ip_address: getClientIP(req),
      user_agent: req.get('user-agent'),
      details: { company_name, tax_number }
    });

    res.status(201).json(formatSuccess(supplier, 'Supplier created successfully'));

  } catch (error) {
    console.error('Create supplier error:', error);

    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(400).json(formatError('Supplier with this tax number already exists'));
    }

    res.status(500).json(formatError('Failed to create supplier'));
  }
};

/**
 * Update supplier
 */
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Check if supplier exists
    const existingSupplier = await Supplier.findById(id);
    if (!existingSupplier) {
      return res.status(404).json(formatError('Supplier not found'));
    }

    // Check ownership
    if (existingSupplier.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(formatError('Access denied'));
    }

    // If tax number is being updated, check uniqueness
    if (updateData.tax_number && updateData.tax_number !== existingSupplier.tax_number) {
      const duplicateSupplier = await Supplier.findByTaxNumber(updateData.tax_number, userId);
      if (duplicateSupplier) {
        return res.status(400).json(formatError('A supplier with this tax number already exists'));
      }
    }

    // Update supplier
    const supplier = await Supplier.update(id, updateData);

    // Log the action
    await AuditLog.create({
      user_id: userId,
      action: 'UPDATE_SUPPLIER',
      entity_type: 'supplier',
      entity_id: id,
      ip_address: getClientIP(req),
      user_agent: req.get('user-agent'),
      details: { updated_fields: Object.keys(updateData) }
    });

    res.json(formatSuccess(supplier, 'Supplier updated successfully'));

  } catch (error) {
    console.error('Update supplier error:', error);

    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(400).json(formatError('Supplier with this tax number already exists'));
    }

    res.status(500).json(formatError('Failed to update supplier'));
  }
};

/**
 * Delete supplier
 */
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if supplier exists
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json(formatError('Supplier not found'));
    }

    // Check ownership
    if (supplier.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(formatError('Access denied'));
    }

    // Delete supplier
    await Supplier.delete(id);

    // Log the action
    await AuditLog.create({
      user_id: userId,
      action: 'DELETE_SUPPLIER',
      entity_type: 'supplier',
      entity_id: id,
      ip_address: getClientIP(req),
      user_agent: req.get('user-agent'),
      details: { company_name: supplier.company_name, tax_number: supplier.tax_number }
    });

    res.json(formatSuccess(null, 'Supplier deleted successfully'));

  } catch (error) {
    console.error('Delete supplier error:', error);

    // Check if supplier has related purchase orders
    if (error.code === '23503') {
      return res.status(400).json(formatError('Cannot delete supplier with existing purchase orders'));
    }

    res.status(500).json(formatError('Failed to delete supplier'));
  }
};

/**
 * Get supplier performance
 */
const getSupplierPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if supplier exists and belongs to user
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json(formatError('Supplier not found'));
    }

    if (supplier.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(formatError('Access denied'));
    }

    const performance = await Supplier.getPerformance(id);

    // Calculate on-time delivery percentage
    if (performance.delivered_orders > 0) {
      performance.on_time_percentage = (
        (performance.on_time_deliveries / performance.delivered_orders) * 100
      ).toFixed(2);
    } else {
      performance.on_time_percentage = 0;
    }

    res.json(formatSuccess(performance));

  } catch (error) {
    console.error('Get supplier performance error:', error);
    res.status(500).json(formatError('Failed to fetch supplier performance'));
  }
};

/**
 * Search suppliers
 */
const searchSuppliers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const userId = req.user.id;

    if (!q) {
      return res.json(formatSuccess([]));
    }

    const suppliers = await Supplier.search(q, userId, parseInt(limit));
    res.json(formatSuccess(suppliers));

  } catch (error) {
    console.error('Search suppliers error:', error);
    res.status(500).json(formatError('Failed to search suppliers'));
  }
};

/**
 * Get performance report for all suppliers
 */
const getPerformanceReport = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all active suppliers for this user
    const suppliers = await Supplier.findAll({ user_id: userId, is_active: true, limit: 1000 });

    // Get performance data for each supplier
    const performanceData = await Promise.all(
      suppliers.map(async (supplier) => {
        const performance = await Supplier.getPerformance(supplier.id);

        if (performance.delivered_orders > 0) {
          performance.on_time_percentage = (
            (performance.on_time_deliveries / performance.delivered_orders) * 100
          ).toFixed(2);
        } else {
          performance.on_time_percentage = 0;
        }

        return performance;
      })
    );

    res.json(formatSuccess(performanceData));

  } catch (error) {
    console.error('Get performance report error:', error);
    res.status(500).json(formatError('Failed to fetch performance report'));
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierPerformance,
  searchSuppliers,
  getPerformanceReport
};
