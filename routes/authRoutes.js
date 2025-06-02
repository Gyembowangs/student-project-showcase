const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Test route
router.get('/test', (req, res) => {
  console.log('✅ test route hit');
  res.send('✅ test route hit');
});

// Root route
router.get('/', (req, res) => {
  res.render('pages/landing');
});

// Signup routes
router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);

// Email verification routes
router.get('/verify-email', authController.verifyEmail);
router.get('/verify-message', (req, res) => {
  res.render('pages/verify-message');
});

// Login routes
router.get('/login', (req, res) => {
  // Get error message from query parameter (if any), otherwise empty string
  const message = req.query.error || '';
  res.render('pages/login', { message });
});
router.post('/login', authController.postLogin);

// Forgot and reset password routes
router.get('/forgot-password', authController.getForgotPassword);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password', authController.getResetPassword);
router.post('/reset-password', authController.resetPassword);

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/user/home'); // or an error page
    }
    res.clearCookie('connect.sid'); // Optional: clear session cookie
    res.redirect('/login');
  });
});

module.exports = router;
