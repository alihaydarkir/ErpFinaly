const pool = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  /**
   * Create a new user
   */
  static async create({ username, email, password, role = 'user' }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, created_at
    `;

    const values = [username, email, hashedPassword, role];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const query = 'SELECT id, username, email, role, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  /**
   * Get all users
   */
  static async findAll(limit = 100, offset = 0) {
    const query = `
      SELECT id, username, email, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Update user
   */
  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.username) {
      fields.push(`username = $${paramCount}`);
      values.push(data.username);
      paramCount++;
    }
    if (data.email) {
      fields.push(`email = $${paramCount}`);
      values.push(data.email);
      paramCount++;
    }
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      fields.push(`password_hash = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }
    if (data.role) {
      fields.push(`role = $${paramCount}`);
      values.push(data.role);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `
      UPDATE users
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING id, username, email, role, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete user
   */
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Count total users
   */
  static async count() {
    const query = 'SELECT COUNT(*) FROM users';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }
}

module.exports = User;
