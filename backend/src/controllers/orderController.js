const Order = require('../models/Order');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const emailService = require('../services/emailService');
const cacheService = require('../services/cacheService');
const { formatOrder, formatOrders, formatSuccess, formatError, formatPaginated } = require('../utils/formatters');
const { getClientIP, calculateOffset } = require('../utils/helpers');

/**
 * Get all orders
 */
const getAllOrders = async (req, res) => {
  try {
    const { user_id, status, start_date, end_date, page = 1, limit = 20 } = req.query;

    // Build filters
    const filters = {
      user_id: user_id ? parseInt(user_id) : undefined,
      status,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      limit: parseInt(limit),
      offset: calculateOffset(parseInt(page), parseInt(limit))
    };

    const orders = await Order.findAll(filters);
    const total = await Order.count({ user_id, status });

    const result = formatPaginated(
      formatOrders(orders),
      total,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json(formatError('Failed to fetch orders'));
  }
};

/**
 * Get order by ID
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json(formatError('Order not found'));
    }

    res.json(formatSuccess(formatOrder(order)));

  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json(formatError('Failed to fetch order'));
  }
};

/**
 * Create new order
 */
const createOrder = async (req, res) => {
  try {
    const { user_id, items, total_amount, status = 'pending' } = req.body;

    // Validate user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json(formatError('User not found'));
    }

    const order = await Order.create({
      user_id,
      items,
      total_amount,
      status
    });

    // Log activity
    await AuditLog.create({
      user_id: req.user.userId,
      action: 'CREATE',
      entity_type: 'order',
      entity_id: order.id,
      changes: { order_id: order.id, total_amount, items_count: items.length },
      ip_address: getClientIP(req)
    });

    // Send order confirmation email
    emailService.sendOrderConfirmationEmail(order, user).catch(err =>
      console.error('Order confirmation email error:', err)
    );

    // Invalidate cache
    await cacheService.invalidateOrderCache();

    console.log(`Order created: #${order.id} by user ${user_id}`);

    res.status(201).json(formatSuccess(formatOrder(order), 'Order created'));

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json(formatError(error.message || 'Failed to create order'));
  }
};

/**
 * Update order
 */
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const order = await Order.update(id, updates);

    if (!order) {
      return res.status(404).json(formatError('Order not found'));
    }

    // Log activity
    await AuditLog.create({
      user_id: req.user.userId,
      action: 'UPDATE',
      entity_type: 'order',
      entity_id: id,
      changes: updates,
      ip_address: getClientIP(req)
    });

    // Invalidate cache
    await cacheService.invalidateOrderCache();

    console.log(`Order updated: #${id} by user ${req.user.userId}`);

    res.json(formatSuccess(formatOrder(order), 'Order updated'));

  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json(formatError('Failed to update order'));
  }
};

/**
 * Delete order
 */
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json(formatError('Order not found'));
    }

    await Order.delete(id);

    // Log activity
    await AuditLog.create({
      user_id: req.user.userId,
      action: 'DELETE',
      entity_type: 'order',
      entity_id: id,
      changes: { deleted_order: id },
      ip_address: getClientIP(req)
    });

    // Invalidate cache
    await cacheService.invalidateOrderCache();

    console.log(`Order deleted: #${id} by user ${req.user.userId}`);

    res.json(formatSuccess(null, 'Order deleted'));

  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json(formatError('Failed to delete order'));
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder
};

