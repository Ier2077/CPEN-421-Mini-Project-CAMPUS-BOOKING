// routes/bookingRoutes.js
const express = require('express');
const router  = express.Router();
const BookingController = require('../controllers/bookingController');
const { requireLogin, requireOwnerOrAdmin } = require('../middleware/auth');

// All booking routes require login
router.use(requireLogin);

router.get('/',    BookingController.getAllBookings);   // admin→all, user→own
router.get('/:id', BookingController.getBookingById);  // own or admin
router.post('/',   BookingController.createBooking);   // user_id from session

// Only the owner or admin can modify/cancel
router.put('/:id',    requireOwnerOrAdmin, BookingController.updateBooking);
router.delete('/:id', requireOwnerOrAdmin, BookingController.deleteBooking);

module.exports = router;
