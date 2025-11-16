const pool = require('../config/database');

class Cheque {
  // Get all cheques with filters
  static async findAll(filters = {}) {
    let query = `
      SELECT
        c.*,
        u.name as created_by_name
      FROM cheques c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    // Filter by status
    if (filters.status) {
      query += ` AND c.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    // Filter by type
    if (filters.type) {
      query += ` AND c.type = $${paramCount}`;
      values.push(filters.type);
      paramCount++;
    }

    // Filter by date range
    if (filters.startDate) {
      query += ` AND c.due_date >= $${paramCount}`;
      values.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND c.due_date <= $${paramCount}`;
      values.push(filters.endDate);
      paramCount++;
    }

    // Search by cheque number or drawer name
    if (filters.search) {
      query += ` AND (c.cheque_number ILIKE $${paramCount} OR c.drawer_name ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ` ORDER BY c.due_date DESC, c.created_at DESC`;

    // Pagination
    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
      paramCount++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramCount}`;
      values.push(filters.offset);
      paramCount++;
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Get cheque by ID
  static async findById(id) {
    const result = await pool.query(
      `SELECT
        c.*,
        u.name as created_by_name
      FROM cheques c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Get cheque by cheque number
  static async findByChequeNumber(chequeNumber) {
    const result = await pool.query(
      'SELECT * FROM cheques WHERE cheque_number = $1',
      [chequeNumber]
    );
    return result.rows[0];
  }

  // Create new cheque
  static async create(chequeData, userId) {
    const {
      cheque_number,
      amount,
      currency,
      issue_date,
      due_date,
      drawer_name,
      drawer_tax_number,
      bank_name,
      bank_branch,
      account_number,
      payee_name,
      type,
      notes
    } = chequeData;

    const result = await pool.query(
      `INSERT INTO cheques (
        cheque_number, amount, currency, issue_date, due_date,
        drawer_name, drawer_tax_number, bank_name, bank_branch,
        account_number, payee_name, type, notes, created_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending')
      RETURNING *`,
      [
        cheque_number, amount, currency || 'TRY', issue_date, due_date,
        drawer_name, drawer_tax_number, bank_name, bank_branch,
        account_number, payee_name, type || 'receivable', notes, userId
      ]
    );

    // Log transaction
    await this.logTransaction(result.rows[0].id, 'created', null, 'pending', userId, amount, 'Cheque created');

    return result.rows[0];
  }

  // Update cheque
  static async update(id, chequeData, userId) {
    const cheque = await this.findById(id);
    if (!cheque) return null;

    const {
      amount,
      currency,
      issue_date,
      due_date,
      drawer_name,
      drawer_tax_number,
      bank_name,
      bank_branch,
      account_number,
      payee_name,
      type,
      notes
    } = chequeData;

    const result = await pool.query(
      `UPDATE cheques SET
        amount = COALESCE($1, amount),
        currency = COALESCE($2, currency),
        issue_date = COALESCE($3, issue_date),
        due_date = COALESCE($4, due_date),
        drawer_name = COALESCE($5, drawer_name),
        drawer_tax_number = COALESCE($6, drawer_tax_number),
        bank_name = COALESCE($7, bank_name),
        bank_branch = COALESCE($8, bank_branch),
        account_number = COALESCE($9, account_number),
        payee_name = COALESCE($10, payee_name),
        type = COALESCE($11, type),
        notes = COALESCE($12, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *`,
      [
        amount, currency, issue_date, due_date, drawer_name,
        drawer_tax_number, bank_name, bank_branch, account_number,
        payee_name, type, notes, id
      ]
    );

    // Log transaction
    await this.logTransaction(id, 'updated', null, null, userId, amount, 'Cheque updated');

    return result.rows[0];
  }

  // Update cheque status
  static async updateStatus(id, newStatus, userId, notes = null) {
    const cheque = await this.findById(id);
    if (!cheque) return null;

    const result = await pool.query(
      `UPDATE cheques SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *`,
      [newStatus, id]
    );

    // Log transaction
    await this.logTransaction(id, 'status_changed', cheque.status, newStatus, userId, cheque.amount, notes || `Status changed from ${cheque.status} to ${newStatus}`);

    return result.rows[0];
  }

  // Delete cheque
  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM cheques WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  // Get cheque transactions
  static async getTransactions(chequeId) {
    const result = await pool.query(
      `SELECT
        ct.*,
        u.name as performed_by_name
      FROM cheque_transactions ct
      LEFT JOIN users u ON ct.performed_by = u.id
      WHERE ct.cheque_id = $1
      ORDER BY ct.transaction_date DESC`,
      [chequeId]
    );
    return result.rows;
  }

  // Log transaction
  static async logTransaction(chequeId, transactionType, oldStatus, newStatus, userId, amount, notes) {
    await pool.query(
      `INSERT INTO cheque_transactions (
        cheque_id, transaction_type, old_status, new_status,
        performed_by, amount, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [chequeId, transactionType, oldStatus, newStatus, userId, amount, notes]
    );
  }

  // Get statistics
  static async getStatistics(filters = {}) {
    let query = `
      SELECT
        status,
        type,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM cheques
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.type) {
      query += ` AND type = $${paramCount}`;
      values.push(filters.type);
      paramCount++;
    }

    query += ` GROUP BY status, type ORDER BY status, type`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Get due cheques (cheques that are due soon)
  static async getDueCheques(days = 7) {
    const result = await pool.query(
      `SELECT
        c.*,
        u.name as created_by_name
      FROM cheques c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.status = 'pending'
        AND c.due_date <= CURRENT_DATE + $1 * INTERVAL '1 day'
        AND c.due_date >= CURRENT_DATE
      ORDER BY c.due_date ASC`,
      [days]
    );
    return result.rows;
  }
}

module.exports = Cheque;
