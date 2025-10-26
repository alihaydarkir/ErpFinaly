const pool = require('../config/database');
const logger = require('../middleware/logger');

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json({ orders: result.rows });
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get order by id
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: result.rows[0] });
  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create order
const createOrder = async (req, res) => {
  try {
    const { user_id, order_number, status, total_amount, items } = req.body;

    const result = await pool.query(
      'INSERT INTO orders (user_id, order_number, status, total_amount, items) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, order_number, status || 'pending', total_amount, JSON.stringify(items)]
    );

    logger.info(`Order created: ${order_number}`);
    res.status(201).json({ order: result.rows[0] });
  } catch (error) {
    logger.error('Create order error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Update order
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      setClause.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    values.push(id);
    const query = `UPDATE orders SET ${setClause.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    logger.info(`Order updated: ${id}`);
    res.json({ order: result.rows[0] });
  } catch (error) {
    logger.error('Update order error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    logger.info(`Order deleted: ${id}`);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    logger.error('Delete order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
};

