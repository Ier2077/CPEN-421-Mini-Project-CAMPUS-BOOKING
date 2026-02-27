// controllers/bookingController.js — AUTH UPDATED
const BookingModel  = require('../models/bookingModel');
const FacilityModel = require('../models/facilityModel');

function generate30MinSlots(open = '07:00', close = '22:00') {
  const slots = [];
  let [h, m] = open.split(':').map(Number);
  const [eH, eM] = close.split(':').map(Number);
  while (h < eH || (h === eH && m < eM)) {
    const s = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    m += 30; if (m >= 60) { m -= 60; h++; }
    slots.push({ start: s, end: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` });
  }
  return slots;
}
function isSlotBooked(slot, bookings) {
  return bookings.some(b => slot.start < b.end_time.slice(0,5) && slot.end > b.start_time.slice(0,5));
}
function isValidTime(t) { return /^\d{2}:\d{2}$/.test(t); }
function isValidDate(d)  { return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d)); }

const BookingController = {

  // GET /bookings — admins see all; students see only their own
  async getAllBookings(req, res) {
    try {
      const u = req.session.user;
      const bookings = u.role === 'admin'
        ? await BookingModel.getAll()
        : await BookingModel.getByUserId(u.id);
      return res.status(200).json({ success: true, count: bookings.length, data: bookings });
    } catch (err) {
      console.error('getAllBookings:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getBookingById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid ID' });
      const booking = await BookingModel.getById(id);
      if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
      const u = req.session.user;
      if (u.role !== 'admin' && booking.user_id !== u.id)
        return res.status(403).json({ success: false, error: 'Forbidden' });
      return res.status(200).json({ success: true, data: booking });
    } catch (err) {
      console.error('getBookingById:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  // POST /bookings — user_id ALWAYS from session, never from body
  async createBooking(req, res) {
    try {
      const { facility_id, date, start_time, end_time } = req.body;
      const user_id = req.session.user.id; // ← THE KEY FIX

      if (!facility_id || !date || !start_time || !end_time)
        return res.status(400).json({ success: false, error: 'facility_id, date, start_time, end_time are required' });
      if (!isValidDate(date))
        return res.status(400).json({ success: false, error: 'date must be YYYY-MM-DD' });
      if (!isValidTime(start_time) || !isValidTime(end_time))
        return res.status(400).json({ success: false, error: 'Times must be HH:MM' });
      if (start_time >= end_time)
        return res.status(400).json({ success: false, error: 'start_time must be before end_time' });

      const facility = await FacilityModel.getById(parseInt(facility_id, 10));
      if (!facility) return res.status(404).json({ success: false, error: 'Facility not found' });

      const conflict = await BookingModel.findConflict(facility_id, date, start_time, end_time);
      if (conflict)
        return res.status(409).json({ success: false, error: 'Time slot already booked' });

      const booking = await BookingModel.create({ facility_id, user_id, date, start_time, end_time, status: 'confirmed' });
      return res.status(201).json({ success: true, data: booking });
    } catch (err) {
      console.error('createBooking:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  // PUT /bookings/:id — requireOwnerOrAdmin runs first
  async updateBooking(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid ID' });
      const existing = req.booking || await BookingModel.getById(id);
      if (!existing) return res.status(404).json({ success: false, error: 'Booking not found' });

      const { date, start_time, end_time, status } = req.body;
      if (date && !isValidDate(date)) return res.status(400).json({ success: false, error: 'Invalid date' });
      if (start_time && !isValidTime(start_time)) return res.status(400).json({ success: false, error: 'Invalid start_time' });
      if (end_time && !isValidTime(end_time)) return res.status(400).json({ success: false, error: 'Invalid end_time' });
      if (status && !['confirmed','cancelled','pending'].includes(status))
        return res.status(400).json({ success: false, error: 'Invalid status' });

      const fStart = start_time || existing.start_time.slice(0,5);
      const fEnd   = end_time   || existing.end_time.slice(0,5);
      const fDate  = date       || existing.date;
      if (fStart >= fEnd) return res.status(400).json({ success: false, error: 'start_time must be before end_time' });

      const conflict = await BookingModel.findConflict(existing.facility_id, fDate, fStart, fEnd, id);
      if (conflict) return res.status(409).json({ success: false, error: 'Time slot conflict' });

      const updated = await BookingModel.update(id, { date, start_time, end_time, status });
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      console.error('updateBooking:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  // DELETE /bookings/:id — requireOwnerOrAdmin runs first
  async deleteBooking(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid ID' });
      const booking = await BookingModel.delete(id);
      if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
      return res.status(200).json({ success: true, message: `Booking #${id} cancelled` });
    } catch (err) {
      console.error('deleteBooking:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getStats(req, res) {
    try {
      const stats = await BookingModel.getStats();
      return res.status(200).json({ success: true, data: stats });
    } catch (err) {
      console.error('getStats:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async checkAvailability(req, res) {
    try {
      const { facility_id, date } = req.query;
      if (!facility_id || !date)
        return res.status(400).json({ success: false, error: 'facility_id and date required' });
      if (!isValidDate(date))
        return res.status(400).json({ success: false, error: 'date must be YYYY-MM-DD' });

      const facility = await FacilityModel.getById(parseInt(facility_id, 10));
      if (!facility) return res.status(404).json({ success: false, error: 'Facility not found' });

      const existing = await BookingModel.getByFacilityAndDate(facility_id, date);
      const slots = generate30MinSlots().map(slot => ({
        start_time: slot.start, end_time: slot.end,
        available: !isSlotBooked(slot, existing),
      }));

      return res.status(200).json({ success: true, data: { facility, date, slots } });
    } catch (err) {
      console.error('checkAvailability:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },
};

module.exports = BookingController;
