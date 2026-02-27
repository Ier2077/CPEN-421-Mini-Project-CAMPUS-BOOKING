// models/userModel.js
// MODEL layer — all SQL for the users table
const pool   = require('../config/db');
const bcrypt = require('bcryptjs');

const UserModel = {

  // Used during login to find the account
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    return rows[0] || null;
  },

  // Used to restore session (never return password_hash to client)
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  // Used by register endpoint — hashes the password before storing
  async create({ name, email, password, role = 'student' }) {
    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email.toLowerCase().trim(), password_hash, role]
    );
    return rows[0];
  },

  // Returns true if plain-text matches stored hash
  async verifyPassword(plainText, hash) {
    return bcrypt.compare(plainText, hash);
  },

};

module.exports = UserModel;
