const pool = require('../config/database');

class PurchaseOrder {
  /**
   * Create a new purchase order
   */
  static async create(data) {
    const {
      user_id,
      supplier_id,
      po_number,
      status = 'draft',
      total_amount = 0,
      expected_delivery,
      notes
    } = data;

    const query = `
      INSERT INTO purchase_orders (
        user_id, supplier_id, po_number, status, total_amount, expected_delivery, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [user_id, supplier_id, po_number, status, total_amount, expected_delivery, notes];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find purchase order by ID with supplier and items
   */
  static async findById(id) {
    const query = `
      SELECT
        po.*,
        s.company_name as supplier_name,
        s.contact_name as supplier_contact,
        s.phone_number as supplier_phone,
        s.email as supplier_email,
        u.username as user_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.user_id = u.id
      WHERE po.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const po = result.rows[0];

    // Get items
    const itemsQuery = `
      SELECT
        poi.*,
        p.name as product_name,
        p.sku as product_sku,
        p.unit as product_unit
      FROM purchase_order_items poi
      LEFT JOIN products p ON poi.product_id = p.id
      WHERE poi.po_id = $1
      ORDER BY poi.id
    `;

    const itemsResult = await pool.query(itemsQuery, [id]);
    po.items = itemsResult.rows;

    return po;
  }

  /**
   * Find all purchase orders with filters
   */
  static async findAll(filters = {}) {
    const { user_id, supplier_id, status, limit = 50, offset = 0, search } = filters;

    let query = `
      SELECT
        po.*,
        s.company_name as supplier_name,
        s.contact_name as supplier_contact
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (user_id) {
      query += ` AND po.user_id = $${paramCount}`;
      values.push(user_id);
      paramCount++;
    }

    if (supplier_id) {
      query += ` AND po.supplier_id = $${paramCount}`;
      values.push(supplier_id);
      paramCount++;
    }

    if (status) {
      query += ` AND po.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (search) {
      query += ` AND (
        po.po_number ILIKE $${paramCount} OR
        s.company_name ILIKE $${paramCount}
      )`;
      values.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY po.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Count purchase orders with filters
   */
  static async count(filters = {}) {
    const { user_id, supplier_id, status, search } = filters;

    let query = `
      SELECT COUNT(*)
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (user_id) {
      query += ` AND po.user_id = $${paramCount}`;
      values.push(user_id);
      paramCount++;
    }

    if (supplier_id) {
      query += ` AND po.supplier_id = $${paramCount}`;
      values.push(supplier_id);
      paramCount++;
    }

    if (status) {
      query += ` AND po.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (search) {
      query += ` AND (
        po.po_number ILIKE $${paramCount} OR
        s.company_name ILIKE $${paramCount}
      )`;
      values.push(`%${search}%`);
      paramCount++;
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count);
  }

  /**
   * Update purchase order
   */
  static async update(id, data) {
    const allowedFields = [
      'supplier_id', 'status', 'total_amount', 'received_amount',
      'expected_delivery', 'actual_delivery', 'notes'
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
      UPDATE purchase_orders
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete purchase order
   */
  static async delete(id) {
    const query = 'DELETE FROM purchase_orders WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Add items to purchase order
   */
  static async addItems(po_id, items) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const insertedItems = [];

      for (const item of items) {
        const query = `
          INSERT INTO purchase_order_items (
            po_id, product_id, quantity, unit_price, total_price, notes
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;

        const values = [
          po_id,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.quantity * item.unit_price,
          item.notes || null
        ];

        const result = await client.query(query, values);
        insertedItems.push(result.rows[0]);
      }

      // Update total amount
      const totalAmount = insertedItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
      await client.query(
        'UPDATE purchase_orders SET total_amount = $1, updated_at = NOW() WHERE id = $2',
        [totalAmount, po_id]
      );

      await client.query('COMMIT');
      return insertedItems;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update purchase order item
   */
  static async updateItem(item_id, data) {
    const allowedFields = ['quantity', 'unit_price', 'received_quantity', 'notes'];
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

    // Update total_price if quantity or unit_price changed
    if (data.quantity !== undefined || data.unit_price !== undefined) {
      fields.push(`total_price = quantity * unit_price`);
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(item_id);

    const query = `
      UPDATE purchase_order_items
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Receive purchase order items and update stock
   */
  static async receivePurchaseOrder(po_id, received_items) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let totalReceived = 0;

      for (const item of received_items) {
        // Update received quantity in purchase order item
        await client.query(
          `UPDATE purchase_order_items
           SET received_quantity = received_quantity + $1
           WHERE id = $2`,
          [item.received_quantity, item.po_item_id]
        );

        // Get product info
        const poItemResult = await client.query(
          'SELECT product_id, unit_price FROM purchase_order_items WHERE id = $1',
          [item.po_item_id]
        );

        if (poItemResult.rows.length > 0) {
          const { product_id, unit_price } = poItemResult.rows[0];

          // Update product stock
          await client.query(
            `UPDATE products
             SET stock_quantity = stock_quantity + $1, updated_at = NOW()
             WHERE id = $2`,
            [item.received_quantity, product_id]
          );

          totalReceived += item.received_quantity * parseFloat(unit_price);
        }
      }

      // Check if all items are received
      const itemsCheck = await client.query(
        `SELECT
          SUM(quantity) as total_quantity,
          SUM(received_quantity) as total_received
         FROM purchase_order_items
         WHERE po_id = $1`,
        [po_id]
      );

      const { total_quantity, total_received } = itemsCheck.rows[0];
      let newStatus = 'partial';

      if (parseInt(total_received) >= parseInt(total_quantity)) {
        newStatus = 'received';
      }

      // Update purchase order status and received amount
      await client.query(
        `UPDATE purchase_orders
         SET status = $1,
             received_amount = received_amount + $2,
             actual_delivery = CASE WHEN $1 = 'received' THEN CURRENT_DATE ELSE actual_delivery END,
             updated_at = NOW()
         WHERE id = $3`,
        [newStatus, totalReceived, po_id]
      );

      await client.query('COMMIT');
      return { status: newStatus, received_amount: totalReceived };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate next PO number
   */
  static async generatePONumber(user_id) {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;

    const query = `
      SELECT po_number
      FROM purchase_orders
      WHERE user_id = $1 AND po_number LIKE $2
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [user_id, `${prefix}%`]);

    if (result.rows.length === 0) {
      return `${prefix}001`;
    }

    const lastNumber = result.rows[0].po_number;
    const numberPart = parseInt(lastNumber.split('-').pop()) + 1;
    return `${prefix}${numberPart.toString().padStart(3, '0')}`;
  }

  /**
   * Get pending purchase orders
   */
  static async getPending(user_id) {
    const query = `
      SELECT
        po.*,
        s.company_name as supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.user_id = $1
        AND po.status IN ('sent', 'confirmed', 'partial')
      ORDER BY po.expected_delivery ASC
    `;

    const result = await pool.query(query, [user_id]);
    return result.rows;
  }
}

module.exports = PurchaseOrder;
