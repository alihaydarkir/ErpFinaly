const pool = require('../config/database');

class SupplierPrice {
  /**
   * Create a new supplier price
   */
  static async create(data) {
    const {
      supplier_id,
      product_id,
      price,
      currency = 'TRY',
      minimum_quantity = 1,
      discount_percentage = 0,
      valid_from,
      valid_to
    } = data;

    const query = `
      INSERT INTO supplier_prices (
        supplier_id, product_id, price, currency, minimum_quantity,
        discount_percentage, valid_from, valid_to
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      supplier_id, product_id, price, currency, minimum_quantity,
      discount_percentage, valid_from, valid_to
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find supplier price by ID
   */
  static async findById(id) {
    const query = `
      SELECT
        sp.*,
        s.company_name as supplier_name,
        p.name as product_name,
        p.sku as product_sku
      FROM supplier_prices sp
      LEFT JOIN suppliers s ON sp.supplier_id = s.id
      LEFT JOIN products p ON sp.product_id = p.id
      WHERE sp.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get all prices for a supplier
   */
  static async findBySupplier(supplier_id) {
    const query = `
      SELECT
        sp.*,
        p.name as product_name,
        p.sku as product_sku,
        p.unit as product_unit
      FROM supplier_prices sp
      LEFT JOIN products p ON sp.product_id = p.id
      WHERE sp.supplier_id = $1
      ORDER BY p.name, sp.minimum_quantity
    `;

    const result = await pool.query(query, [supplier_id]);
    return result.rows;
  }

  /**
   * Get all prices for a product
   */
  static async findByProduct(product_id) {
    const query = `
      SELECT
        sp.*,
        s.company_name as supplier_name,
        s.lead_time_days,
        s.rating
      FROM supplier_prices sp
      LEFT JOIN suppliers s ON sp.supplier_id = s.id
      WHERE sp.product_id = $1
        AND s.is_active = true
        AND (sp.valid_to IS NULL OR sp.valid_to >= CURRENT_DATE)
      ORDER BY sp.price ASC
    `;

    const result = await pool.query(query, [product_id]);
    return result.rows;
  }

  /**
   * Get best price for a product from active suppliers
   */
  static async getBestPrice(product_id, quantity = 1) {
    const query = `
      SELECT
        sp.*,
        s.company_name as supplier_name,
        s.lead_time_days,
        s.rating,
        (sp.price * (1 - sp.discount_percentage / 100)) as final_price
      FROM supplier_prices sp
      LEFT JOIN suppliers s ON sp.supplier_id = s.id
      WHERE sp.product_id = $1
        AND s.is_active = true
        AND sp.minimum_quantity <= $2
        AND (sp.valid_to IS NULL OR sp.valid_to >= CURRENT_DATE)
        AND (sp.valid_from IS NULL OR sp.valid_from <= CURRENT_DATE)
      ORDER BY final_price ASC
      LIMIT 1
    `;

    const result = await pool.query(query, [product_id, quantity]);
    return result.rows[0];
  }

  /**
   * Update supplier price
   */
  static async update(id, data) {
    const allowedFields = [
      'price', 'currency', 'minimum_quantity', 'discount_percentage',
      'valid_from', 'valid_to'
    ];

    const fields = [];
    const values = [];
    let paramCount = 1;

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

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE supplier_prices
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete supplier price
   */
  static async delete(id) {
    const query = 'DELETE FROM supplier_prices WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Find price by supplier, product, and quantity
   */
  static async findBySupplierProductQuantity(supplier_id, product_id, minimum_quantity) {
    const query = `
      SELECT * FROM supplier_prices
      WHERE supplier_id = $1 AND product_id = $2 AND minimum_quantity = $3
    `;

    const result = await pool.query(query, [supplier_id, product_id, minimum_quantity]);
    return result.rows[0];
  }

  /**
   * Bulk create supplier prices
   */
  static async bulkCreate(prices) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const insertedPrices = [];

      for (const price of prices) {
        const query = `
          INSERT INTO supplier_prices (
            supplier_id, product_id, price, currency, minimum_quantity,
            discount_percentage, valid_from, valid_to
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (supplier_id, product_id, minimum_quantity)
          DO UPDATE SET
            price = EXCLUDED.price,
            currency = EXCLUDED.currency,
            discount_percentage = EXCLUDED.discount_percentage,
            valid_from = EXCLUDED.valid_from,
            valid_to = EXCLUDED.valid_to,
            updated_at = NOW()
          RETURNING *
        `;

        const values = [
          price.supplier_id,
          price.product_id,
          price.price,
          price.currency || 'TRY',
          price.minimum_quantity || 1,
          price.discount_percentage || 0,
          price.valid_from || null,
          price.valid_to || null
        ];

        const result = await client.query(query, values);
        insertedPrices.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return insertedPrices;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = SupplierPrice;
