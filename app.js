// app.js — Campus Facility Booking System (Auth enabled)
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors    = require('cors');
const path    = require('path');

const authRoutes     = require('./routes/authRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const bookingRoutes  = require('./routes/bookingRoutes');
const BookingController = require('./controllers/bookingController');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Core middleware
app.use(cors({
  origin: 'https://cpen-421-mini-project-campus-booking.onrender.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session (NEW)
app.use(session({
  secret:            process.env.SESSION_SECRET || 'campus-dev-secret-change-me',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    maxAge:   1000 * 60 * 60 * 8,  // 8 hours
  },
}));

// ── Static frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// ── Request logger
app.use((req, _res, next) => {
  const who = req.session?.user ? req.session.user.email : 'guest';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} (${who})`);
  next();
});

// ── API Routes
app.use('/auth',       authRoutes);
app.use('/facilities', facilityRoutes);
app.use('/bookings',   bookingRoutes);

// ── Public (no auth required)
app.get('/availability', BookingController.checkAvailability);
app.get('/stats',        BookingController.getStats);
app.get('/api',          (_req, res) => res.json({ success: true, message: 'Campus Booking API v2.1' }));

// ── SPA fallback
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'frontend', 'index.html')));

// ── 404
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ── Error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Campus Booking  → http://localhost:${PORT}`);
  console.log(`🔐 Auth endpoints  → POST /auth/login | /auth/logout | /auth/register\n`);
});

module.exports = app;
