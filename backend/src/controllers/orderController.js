const Order = require('../models/Order');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const emailService = require('../services/emailService');
const cacheService = require('../services/cacheService');
const { formatOrder, formatOrders, formatSuccess, formatError, formatPaginated } = require('../utils/formatters');
const { getClientIP, calculateOffset } = require('../utils/helpers');
const { ORDER_STATUS, isValidStatusTransition, getNextStatuses } = require('../constants/orderStatus');

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

/**
 * Update order status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!Object.values(ORDER_STATUS).includes(status)) {
      return res.status(400).json(formatError(`Invalid status. Allowed: ${Object.values(ORDER_STATUS).join(', ')}`));
    }

    // Get current order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json(formatError('Order not found'));
    }

    // Check if status transition is valid
    if (!isValidStatusTransition(order.status, status)) {
      const nextStatuses = getNextStatuses(order.status);
      return res.status(400).json(
        formatError(`Cannot change status from '${order.status}' to '${status}'. Allowed: ${nextStatuses.join(', ') || 'none (final state)'}`)
      );
    }

    // Update status
    const updatedOrder = await Order.updateStatus(id, status);

    // Log activity
    await AuditLog.create({
      user_id: req.user.userId,
      action: 'UPDATE_STATUS',
      entity_type: 'order',
      entity_id: id,
      changes: { old_status: order.status, new_status: status },
      ip_address: getClientIP(req)
    });

    // Invalidate cache
    await cacheService.invalidateOrderCache();

    // Send status update email
    const user = await User.findById(order.user_id);
    emailService.sendOrderStatusUpdateEmail(updatedOrder, user, status).catch(err =>
      console.error('Order status update email error:', err)
    );

    console.log(`Order #${id} status updated: ${order.status} → ${status}`);

    res.json(formatSuccess(formatOrder(updatedOrder), 'Order status updated'));

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json(formatError('Failed to update order status'));
  }
};

/**
 * Cancel order (restore stock)
 */
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Get current order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json(formatError('Order not found'));
    }

    // Check if order can be cancelled
    if (!isValidStatusTransition(order.status, ORDER_STATUS.CANCELLED)) {
      return res.status(400).json(
        formatError(`Cannot cancel order with status '${order.status}'. Order is already in final state.`)
      );
    }

    // Cancel order (will restore stock automatically)
    const cancelledOrder = await Order.cancel(id);

    // Log activity
    await AuditLog.create({
      user_id: req.user.userId,
      action: 'CANCEL',
      entity_type: 'order',
      entity_id: id,
      changes: { old_status: order.status, new_status: ORDER_STATUS.CANCELLED, reason },
      ip_address: getClientIP(req)
    });

    // Invalidate cache
    await cacheService.invalidateOrderCache();

    // Send cancellation email
    const user = await User.findById(order.user_id);
    emailService.sendOrderCancellationEmail(cancelledOrder, user, reason).catch(err =>
      console.error('Order cancellation email error:', err)
    );

    console.log(`Order #${id} cancelled by user ${req.user.userId}. Reason: ${reason || 'N/A'}`);

    res.json(formatSuccess(formatOrder(cancelledOrder), 'Order cancelled successfully'));

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json(formatError('Failed to cancel order'));
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
  deleteOrder
};

