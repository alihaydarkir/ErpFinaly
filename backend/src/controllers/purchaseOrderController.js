const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const AuditLog = require('../models/AuditLog');
const { formatSuccess, formatError, formatPaginated } = require('../utils/formatters');
const { getClientIP, calculateOffset } = require('../utils/helpers');

/**
 * Create a new purchase order
 */
const createPurchaseOrder = async (req, res) => {
  try {
    const { supplier_id, items, expected_delivery, notes } = req.body;
    const userId = req.user.id;

    // Verify supplier exists and belongs to user
    const supplier = await Supplier.findById(supplier_id);
    if (!supplier) {
      return res.status(404).json(formatError('Supplier not found'));
    }

    if (supplier.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(formatError('Access denied'));
    }

    // Generate PO number
    const po_number = await PurchaseOrder.generatePONumber(userId);

    // Calculate total amount
    const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    // Create purchase order
    const purchaseOrder = await PurchaseOrder.create({
      user_id: userId,
      supplier_id,
      po_number,
      status: 'draft',
      total_amount,
      expected_delivery,
      notes
    });

    // Add items
    await PurchaseOrder.addItems(purchaseOrder.id, items);

    // Get the complete PO with items
    const completePO = await PurchaseOrder.findById(purchaseOrder.id);

    // Log the action
    await AuditLog.create({
      user_id: userId,
      action: 'CREATE_PURCHASE_ORDER',
      entity_type: 'purchase_order',
      entity_id: purchaseOrder.id,
      ip_address: getClientIP(req),
      user_agent: req.get('user-agent'),
      details: { po_number, supplier_id, total_amount }
    });

    res.status(201).json(formatSuccess(completePO, 'Purchase order created successfully'));

  } catch (error) {
    console.error('Create purchase order error:', error);

    if (error.code === '23505') {
      return res.status(400).json(formatError('Purchase order number already exists'));
    }

    res.status(500).json(formatError('Failed to create purchase order'));
  }
};

/**
 * Get all purchase orders
 */
const getPurchaseOrders = async (req, res) => {
  try {
    const { supplier_id, status, search, page = 1, limit = 50, offset } = req.query;
    const userId = req.user.id;

    const filters = {
      user_id: userId,
      supplier_id: supplier_id ? parseInt(supplier_id) : undefined,
      status,
      search,
      limit: parseInt(limit),
      offset: offset ? parseInt(offset) : calculateOffset(parseInt(page), parseInt(limit))
    };

    const purchaseOrders = await PurchaseOrder.findAll(filters);
    const total = await PurchaseOrder.count({
      user_id: userId,
      supplier_id: filters.supplier_id,
      status,
      search
    });

    const result = formatPaginated(
      purchaseOrders,
      total,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);

  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.status(500).json(formatError('Failed to fetch purchase orders'));
  }
};

/**
 * Get purchase order by ID
 */
const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const purchaseOrder = await PurchaseOrder.findById(id);

    if (!purchaseOrder) {
      return res.status(404).json(formatError('Purchase order not found'));
    }

    // Check ownership
    if (purchaseOrder.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(formatError('Access denied'));
    }

    res.json(formatSuccess(purchaseOrder));

  } catch (error) {
    console.error('Get purchase order by ID error:', error);
    res.status(500).json(formatError('Failed to fetch purchase order'));
  }
};

/**
 * Update purchase order
 */
const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Check if purchase order exists
    const existingPO = await PurchaseOrder.findById(id);
    if (!existingPO) {
      return res.status(404).json(formatError('Purchase order not found'));
    }

    // Check ownership
    if (existingPO.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(formatError('Access denied'));
    }

    // Don't allow updating completed/cancelled orders
    if (['received', 'cancelled'].includes(existingPO.status) && updateData.status !== existingPO.status) {
      return res.status(400).json(formatError('Cannot update completed or cancelled purchase orders'));
    }

    // Update purchase order
    const purchaseOrder = await PurchaseOrder.update(id, updateData);

    // Log the action
    await AuditLog.create({
      user_id: userId,
      action: 'UPDATE_PURCHASE_ORDER',
      entity_type: 'purchase_order',
      entity_id: id,
      ip_address: getClientIP(req),
      user_agent: req.get('user-agent'),
      details: { updated_fields: Object.keys(updateData) }
    });

    res.json(formatSuccess(purchaseOrder, 'Purchase order updated successfully'));

  } catch (error) {
    console.error('Update purchase order error:', error);
    res.status(500).json(formatError('Failed to update purchase order'));
  }
};

/**
 * Send purchase order to supplier
 */
const sendPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if purchase order exists
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      return res.status(404).json(formatError('Purchase order not found'));
    }

    // Check ownership
    if (purchaseOrder.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(formatError('Access denied'));
    }

    // Only draft orders can be sent
    if (purchaseOrder.status !== 'draft') {
      return res.status(400).json(formatError('Only draft purchase orders can be sent'));
    }

    // Update status to sent
    const updatedPO = await PurchaseOrder.update(id, { status: 'sent' });

    // Increment supplier order count
    await Supplier.incrementOrderCount(purchaseOrder.supplier_id);

    // Log the action
    await AuditLog.create({
      user_id: userId,
      action: 'SEND_PURCHASE_ORDER',
      entity_type: 'purchase_order',
      entity_id: id,
      ip_address: getClientIP(req),
      user_agent: req.get('user-agent'),
      details: { po_number: purchaseOrder.po_number }
    });

    res.json(formatSuccess(updatedPO, 'Purchase order sent successfully'));

  } catch (error) {
    console.error('Send purchase order error:', error);
    res.status(500).json(formatError('Failed to send purchase order'));
  }
};

/**
 * Receive purchase order (update stock)
 */
const receivePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // items: [{ po_item_id, received_quantity }]
    const userId = req.user.id;

    // Check if purchase order exists
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      return res.status(404).json(formatError('Purchase order not found'));
    }

    // Check ownership
    if (purchaseOrder.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(formatError('Access denied'));
    }

    // Only sent/confirmed/partial orders can be received
    if (!['sent', 'confirmed', 'partial'].includes(purchaseOrder.status)) {
      return res.status(400).json(formatError('Purchase order cannot be received in current status'));
    }

    // Receive items and update stock
    const result = await PurchaseOrder.receivePurchaseOrder(id, items);

    // Get updated PO
    const updatedPO = await PurchaseOrder.findById(id);

    // Log the action
    await AuditLog.create({
      user_id: userId,
      action: 'RECEIVE_PURCHASE_ORDER',
      entity_type: 'purchase_order',
      entity_id: id,
      ip_address: getClientIP(req),
      user_agent: req.get('user-agent'),
      details: {
        po_number: purchaseOrder.po_number,
        status: result.status,
        received_amount: result.received_amount
      }
    });

    res.json(formatSuccess(updatedPO, 'Purchase order received successfully, stock updated'));

  } catch (error) {
    console.error('Receive purchase order error:', error);
    res.status(500).json(formatError('Failed to receive purchase order'));
  }
};

/**
 * Cancel purchase order
 */
const cancelPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if purchase order exists
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      return res.status(404).json(formatError('Purchase order not found'));
    }

    // Check ownership
    if (purchaseOrder.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(formatError('Access denied'));
    }

    // Cannot cancel already received orders
    if (purchaseOrder.status === 'received') {
      return res.status(400).json(formatError('Cannot cancel received purchase orders'));
    }

    // Update status to cancelled
    const updatedPO = await PurchaseOrder.update(id, { status: 'cancelled' });

    // Log the action
    await AuditLog.create({
      user_id: userId,
      action: 'CANCEL_PURCHASE_ORDER',
      entity_type: 'purchase_order',
      entity_id: id,
      ip_address: getClientIP(req),
      user_agent: req.get('user-agent'),
      details: { po_number: purchaseOrder.po_number }
    });

    res.json(formatSuccess(updatedPO, 'Purchase order cancelled successfully'));

  } catch (error) {
    console.error('Cancel purchase order error:', error);
    res.status(500).json(formatError('Failed to cancel purchase order'));
  }
};

/**
 * Delete purchase order
 */
const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if purchase order exists
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      return res.status(404).json(formatError('Purchase order not found'));
    }

    // Check ownership
    if (purchaseOrder.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json(formatError('Access denied'));
    }

    // Only draft or cancelled orders can be deleted
    if (!['draft', 'cancelled'].includes(purchaseOrder.status)) {
      return res.status(400).json(formatError('Only draft or cancelled purchase orders can be deleted'));
    }

    // Delete purchase order
    await PurchaseOrder.delete(id);

    // Log the action
    await AuditLog.create({
      user_id: userId,
      action: 'DELETE_PURCHASE_ORDER',
      entity_type: 'purchase_order',
      entity_id: id,
      ip_address: getClientIP(req),
      user_agent: req.get('user-agent'),
      details: { po_number: purchaseOrder.po_number }
    });

    res.json(formatSuccess(null, 'Purchase order deleted successfully'));

  } catch (error) {
    console.error('Delete purchase order error:', error);
    res.status(500).json(formatError('Failed to delete purchase order'));
  }
};

/**
 * Get pending purchase orders
 */
const getPendingPurchaseOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const pendingOrders = await PurchaseOrder.getPending(userId);

    res.json(formatSuccess(pendingOrders));

  } catch (error) {
    console.error('Get pending purchase orders error:', error);
    res.status(500).json(formatError('Failed to fetch pending purchase orders'));
  }
};

module.exports = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  sendPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  deletePurchaseOrder,
  getPendingPurchaseOrders
};
