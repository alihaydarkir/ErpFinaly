const pool = require('../config/database');

class Supplier {
  /**
   * Create a new supplier
   */
  static async create(data) {
    const {
      user_id,
      company_name,
      contact_name,
      email,
      tax_number,
      phone_number,
      location,
      payment_terms = 'Net 30',
      lead_time_days = 7,
      min_order_quantity = 1,
      risk_level = 'Medium',
      website,
      notes,
      is_active = true,
      rating = 5.0
    } = data;

    const query = `
      INSERT INTO suppliers (
        user_id, company_name, contact_name, email, tax_number,
        phone_number, location, payment_terms, lead_time_days,
        min_order_quantity, risk_level, website, notes, is_active, rating
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      user_id, company_name, contact_name, email, tax_number,
      phone_number, location, payment_terms, lead_time_days,
      min_order_quantity, risk_level, website, notes, is_active, rating
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find supplier by ID
   */
  static async findById(id) {
    const query = `
      SELECT s.*, u.username as user_name, u.email as user_email
      FROM suppliers s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Find all suppliers with filters
   */
  static async findAll(filters = {}) {
    const { user_id, limit = 50, offset = 0, search, is_active } = filters;

    let query = `
      SELECT s.*, u.username as user_name, u.email as user_email
      FROM suppliers s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    // Filter by user_id if provided
    if (user_id) {
      query += ` AND s.user_id = $${paramCount}`;
      values.push(user_id);
      paramCount++;
    }

    // Filter by active status
    if (is_active !== undefined) {
      query += ` AND s.is_active = $${paramCount}`;
      values.push(is_active);
      paramCount++;
    }

    // Search by name, company, or tax number
    if (search) {
      query += ` AND (
        s.company_name ILIKE $${paramCount} OR
        s.contact_name ILIKE $${paramCount} OR
        s.tax_number ILIKE $${paramCount} OR
        s.email ILIKE $${paramCount}
      )`;
      values.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Count suppliers with filters
   */
  static async count(filters = {}) {
    const { user_id, search, is_active } = filters;

    let query = 'SELECT COUNT(*) FROM suppliers WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (user_id) {
      query += ` AND user_id = $${paramCount}`;
      values.push(user_id);
      paramCount++;
    }

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      values.push(is_active);
      paramCount++;
    }

    if (search) {
      query += ` AND (
        company_name ILIKE $${paramCount} OR
        contact_name ILIKE $${paramCount} OR
        tax_number ILIKE $${paramCount} OR
        email ILIKE $${paramCount}
      )`;
      values.push(`%${search}%`);
      paramCount++;
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count);
  }

  /**
   * Update supplier
   */
  static async update(id, data) {
    const allowedFields = [
      'company_name', 'contact_name', 'email', 'tax_number',
      'phone_number', 'location', 'payment_terms', 'lead_time_days',
      'min_order_quantity', 'risk_level', 'website', 'notes', 'is_active', 'rating'
    ];

    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Add updated_at
    fields.push(`updated_at = NOW()`);

    // Add id to values
    values.push(id);

    const query = `
      UPDATE suppliers
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete supplier
   */
  static async delete(id) {
    const query = 'DELETE FROM suppliers WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Find supplier by tax number
   */
  static async findByTaxNumber(tax_number, user_id) {
    const query = `
      SELECT * FROM suppliers
      WHERE tax_number = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [tax_number, user_id]);
    return result.rows[0];
  }

  /**
   * Increment total orders count
   */
  static async incrementOrderCount(id) {
    const query = `
      UPDATE suppliers
      SET total_orders = total_orders + 1, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get supplier performance metrics
   */
  static async getPerformance(supplier_id) {
    const query = `
      SELECT
        s.id,
        s.company_name,
        s.rating,
        s.total_orders,
        COUNT(po.id) as total_purchase_orders,
        COUNT(CASE WHEN po.status = 'received' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN po.status = 'cancelled' THEN 1 END) as cancelled_orders,
        COUNT(CASE WHEN po.actual_delivery <= po.expected_delivery THEN 1 END) as on_time_deliveries,
        COUNT(CASE WHEN po.actual_delivery IS NOT NULL THEN 1 END) as delivered_orders,
        SUM(po.total_amount) as total_amount_ordered,
        AVG(EXTRACT(DAY FROM (po.actual_delivery - po.created_at::date))) as avg_delivery_days
      FROM suppliers s
      LEFT JOIN purchase_orders po ON s.id = po.supplier_id
      WHERE s.id = $1
      GROUP BY s.id, s.company_name, s.rating, s.total_orders
    `;

    const result = await pool.query(query, [supplier_id]);
    return result.rows[0];
  }

  /**
   * Search suppliers by name
   */
  static async search(search_term, user_id, limit = 10) {
    const query = `
      SELECT id, company_name, contact_name, email, phone_number, lead_time_days, is_active
      FROM suppliers
      WHERE user_id = $1
        AND is_active = true
        AND (company_name ILIKE $2 OR contact_name ILIKE $2)
      ORDER BY company_name
      LIMIT $3
    `;

    const result = await pool.query(query, [user_id, `%${search_term}%`, limit]);
    return result.rows;
  }
}

module.exports = Supplier;
