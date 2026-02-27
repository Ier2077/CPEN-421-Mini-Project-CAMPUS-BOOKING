// models/facilityModel.js
const pool = require('../config/db');

const FacilityModel = {

  async getAll() {
    const result = await pool.query('SELECT * FROM facilities ORDER BY id ASC');
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query('SELECT * FROM facilities WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create({ name, location, capacity }) {
    const result = await pool.query(
      `INSERT INTO facilities (name, location, capacity)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, location, capacity]
    );
    return result.rows[0];
  },

  async update(id, { name, location, capacity }) {
    const result = await pool.query(
      `UPDATE facilities
       SET name     = COALESCE($1, name),
           location = COALESCE($2, location),
           capacity = COALESCE($3, capacity)
       WHERE id = $4 RETURNING *`,
      [name, location, capacity, id]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    const result = await pool.query(
      'DELETE FROM facilities WHERE id = $1 RETURNING *', [id]
    );
    return result.rows[0] || null;
  },

};

module.exports = FacilityModel;
