// middleware/auth.js
// Guards used on routes that require authentication or ownership

const BookingModel = require('../models/bookingModel');

/**
 * requireLogin
 * Blocks any request where the session has no logged-in user.
 * Attach to any route that needs authentication.
 */
function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({
    success: false,
    error:   'Unauthorised: please log in first',
  });
}

/**
 * requireAdmin
 * Only allows users with role = 'admin' to proceed.
 * Must be used AFTER requireLogin.
 */
function requireAdmin(req, res, next) {
  if (req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    error:   'Forbidden: admin access required',
  });
}

/**
 * requireOwnerOrAdmin
 * For booking-specific routes (DELETE /bookings/:id etc.)
 * Allows the booking's owner OR an admin to proceed.
 * Blocks everyone else with 403.
 */
async function requireOwnerOrAdmin(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    const booking = await BookingModel.getById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const sessionUser = req.session.user;
    const isOwner     = booking.user_id === sessionUser.id;
    const isAdmin     = sessionUser.role === 'admin';

    if (isOwner || isAdmin) {
      req.booking = booking; // pass it forward so controller doesn't re-query
      return next();
    }

    return res.status(403).json({
      success: false,
      error:   'Forbidden: you can only modify your own bookings',
    });
  } catch (err) {
    console.error('requireOwnerOrAdmin error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

module.exports = { requireLogin, requireAdmin, requireOwnerOrAdmin };
