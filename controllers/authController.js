// controllers/authController.js
// CONTROLLER layer — handles login, logout, register, session check
const UserModel = require('../models/userModel');

const AuthController = {

  /**
   * POST /auth/login
   * Body: { email, password }
   * Creates a session and returns the user (no password_hash).
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
      }

      // 1. Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // 2. Verify password
      const valid = await UserModel.verifyPassword(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // 3. Store in session (never store password_hash)
      req.session.user = {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      };

      return res.status(200).json({
        success: true,
        message: `Welcome back, ${user.name}!`,
        data: req.session.user,
      });
    } catch (err) {
      console.error('login error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  /**
   * POST /auth/logout
   * Clears the cookie-session by setting it to null.
     */
  async logout(req, res) {
    req.session = null;
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  },

  /**
   * POST /auth/register
   * Body: { name, email, password }
   * Creates a new student account.
   */
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Name, email, and password are required',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters',
        });
      }

      // Check if email already exists
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists',
        });
      }

      // Create user (role defaults to 'student')
      const user = await UserModel.create({ name, email, password });

      // Log them in immediately
      req.session.user = {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      };

      return res.status(201).json({
        success: true,
        message: `Account created! Welcome, ${user.name}!`,
        data: req.session.user,
      });
    } catch (err) {
      console.error('register error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  /**
   * GET /auth/me
   * Returns the currently logged-in user from session.
   * Frontend calls this on page load to check auth state.
   */
  async me(req, res) {
    if (req.session && req.session.user) {
      return res.status(200).json({ success: true, data: req.session.user });
    }
    return res.status(401).json({ success: false, error: 'Not logged in' });
  },

};

module.exports = AuthController;