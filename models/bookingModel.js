// models/bookingModel.js — AUTH UPDATED (adds getByUserId)
const pool = require('../config/db');

const BookingModel = {

  async getAll() {
    const { rows } = await pool.query(
      `SELECT b.id, b.date, b.start_time, b.end_time, b.status, b.created_at,
              f.id AS facility_id, f.name AS facility_name, f.location, f.capacity,
              u.id AS user_id, u.name AS user_name, u.email, u.role
       FROM bookings b
       JOIN facilities f ON b.facility_id = f.id
       JOIN users      u ON b.user_id     = u.id
       ORDER BY b.date ASC, b.start_time ASC`
    );
    return rows;
  },

  // NEW: returns only this user's bookings
  async getByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT b.id, b.date, b.start_time, b.end_time, b.status, b.created_at,
              f.id AS facility_id, f.name AS facility_name, f.location, f.capacity,
              u.id AS user_id, u.name AS user_name, u.email, u.role
       FROM bookings b
       JOIN facilities f ON b.facility_id = f.id
       JOIN users      u ON b.user_id     = u.id
       WHERE b.user_id = $1
       ORDER BY b.date ASC, b.start_time ASC`,
      [userId]
    );
    return rows;
  },

  async getById(id) {
    const { rows } = await pool.query(
      `SELECT b.id, b.date, b.start_time, b.end_time, b.status, b.created_at,
              f.id AS facility_id, f.name AS facility_name, f.location, f.capacity,
              u.id AS user_id, u.name AS user_name, u.email, u.role
       FROM bookings b
       JOIN facilities f ON b.facility_id = f.id
       JOIN users      u ON b.user_id     = u.id
       WHERE b.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async findConflict(facility_id, date, start_time, end_time, excludeId = null) {
    const { rows } = await pool.query(
      `SELECT id FROM bookings
       WHERE facility_id = $1 AND date = $2 AND status != 'cancelled'
         AND ($3::time < end_time AND $4::time > start_time)
         AND ($5::int IS NULL OR id != $5)`,
      [facility_id, date, start_time, end_time, excludeId]
    );
    return rows.length > 0;
  },

  async create({ facility_id, user_id, date, start_time, end_time, status = 'confirmed' }) {
    const { rows } = await pool.query(
      `INSERT INTO bookings (facility_id, user_id, date, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [facility_id, user_id, date, start_time, end_time, status]
    );
    return rows[0];
  },

  async update(id, { date, start_time, end_time, status }) {
    const { rows } = await pool.query(
      `UPDATE bookings
       SET date = COALESCE($1, date), start_time = COALESCE($2, start_time),
           end_time = COALESCE($3, end_time), status = COALESCE($4, status)
       WHERE id = $5 RETURNING *`,
      [date, start_time, end_time, status, id]
    );
    return rows[0] || null;
  },

  async delete(id) {
    const { rows } = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING *', [id]);
    return rows[0] || null;
  },

  async getByFacilityAndDate(facility_id, date) {
    const { rows } = await pool.query(
      `SELECT start_time, end_time FROM bookings
       WHERE facility_id = $1 AND date = $2 AND status != 'cancelled' ORDER BY start_time`,
      [facility_id, date]
    );
    return rows;
  },

  async getStats() {
    const { rows } = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM facilities) AS total_facilities,
         (SELECT COUNT(*) FROM bookings WHERE status != 'cancelled') AS total_bookings,
         (SELECT COUNT(*) FROM bookings WHERE date = CURRENT_DATE AND status != 'cancelled') AS today_bookings,
         (SELECT COUNT(*) FROM bookings WHERE status = 'pending') AS pending_bookings,
         (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND date >= CURRENT_DATE) AS upcoming_bookings`
    );
    return rows[0];
  },
};

module.exports = BookingModel;
