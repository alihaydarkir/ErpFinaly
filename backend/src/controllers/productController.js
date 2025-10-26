const pool = require('../config/database');
const logger = require('../middleware/logger');

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ products: result.rows });
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get product by id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product: result.rows[0] });
  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create product
const createProduct = async (req, res) => {
  try {
    const { name, description, sku, category, price, stock_quantity, reorder_level } = req.body;

    const result = await pool.query(
      'INSERT INTO products (name, description, sku, category, price, stock_quantity, reorder_level) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, description, sku, category, price, stock_quantity || 0, reorder_level || 10]
    );

    logger.info(`Product created: ${sku}`);
    res.status(201).json({ product: result.rows[0] });
  } catch (error) {
    logger.error('Create product error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Update product
const updateProduct = async (req, res) => {
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
    const query = `UPDATE products SET ${setClause.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    logger.info(`Product updated: ${id}`);
    res.json({ product: result.rows[0] });
  } catch (error) {
    logger.error('Update product error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    logger.info(`Product deleted: ${id}`);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

