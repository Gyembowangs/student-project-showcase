const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const User = require('../models/User'); // Sequelize model
const saltRounds = 10;

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// GET Login
exports.getLogin = (req, res) => {
  res.render('pages/login', { message: null });
};

// POST Login
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Admin login using .env
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

      req.session.user = { email, isAdmin: true, role: 'admin' };
      res.cookie('jwt', token, { httpOnly: true });

      return res.redirect('/admin/adminDashboard');
    }

    // Normal user login
    const user = await User.findOne({ where: { email } });
    if (!user) return res.render('pages/login', { message: 'Invalid credentials!' });
    if (!user.isVerified) return res.render('pages/login', { message: 'Please verify your email first.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('pages/login', { message: 'Invalid credentials!' });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    req.session.user = {
      id: user.id,
      email: user.email,
      isAdmin: user.role === 'admin',
      role: user.role,
    };
    res.cookie('jwt', token, { httpOnly: true });

    return user.role === 'admin' ? res.redirect('/admin/adminDashboard') : res.redirect('/user/home');
  } catch (error) {
    console.error('Login error:', error);
    res.render('pages/login', { message: 'Error during login.' });
  }
};

// GET Signup
exports.getSignup = (req, res) => {
  res.render('pages/signup', { message: null });
};

// POST Signup
exports.postSignup = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.render('pages/signup', { message: '⚠️ Email already registered!' });

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const verifyUrl = `${process.env.BASE_URL}/verify-email?token=${verificationToken}&email=${email}`;

    await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'guest',
      verificationToken,
      isVerified: false,
    });

    await transporter.sendMail({
      from: `"Sherubtse Student Project Showcase" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '📩 Please verify your email',
      html: `
        <h3>Hello ${firstName},</h3>
        <p>Please verify your email by clicking the button below:</p>
        <a href="${verifyUrl}" target="_blank" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none;">Verify Email</a>
        <p>This link expires in 1 hour.</p>
      `,
    });

    res.render('pages/verify-message', { email, firstName });

  } catch (error) {
    console.error('Signup Error:', error);
    res.render('pages/signup', { message: '❌ Error during signup. Please try again.' });
  }
};

// Email verification route
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    await User.update({ isVerified: true, verificationToken: null }, { where: { email } });

    res.send(`
      <html>
        <head>
          <title>Email Verified</title>
          <style>
            body { font-family: Arial; text-align: center; margin-top: 50px; }
            .btn { background-color: #4CAF50; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; }
          </style>
        </head>
        <body>
          <h2>✅ Email verified successfully</h2>
          <p>You can now log in to your account.</p>
          <a href="/login" class="btn">Login Now</a>
        </body>
      </html>
    `);
  } catch (error) {
    res.send(`
      <html>
        <head><title>Verification Failed</title></head>
        <body style="font-family: Arial; text-align: center; margin-top: 50px; color: red;">
          <h2>❌ Invalid or expired verification link.</h2>
        </body>
      </html>
    `);
  }
};

// GET Forgot Password
exports.getForgotPassword = (req, res) => {
  res.render('pages/forgot-password', { message: null });
};

// POST Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.render('pages/forgot-password', { message: 'Email not found' });

    const resetToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    await User.update({ resetToken }, { where: { email } });

    const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"Sherubtse Student Project Showcase" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      text: `Click the link below to reset your password:\n\n${resetLink}`,
    });

    res.render('pages/forgot-password', { message: 'Password reset link has been sent to your email.' });

  } catch (error) {
    console.error(error);
    res.render('pages/forgot-password', { message: 'Something went wrong. Please try again.' });
  }
};

// GET Reset Password Page
exports.getResetPassword = (req, res) => {
  const { token } = req.query;
  res.render('pages/reset-password', { token, message: null });
};

// POST Reset Password
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ where: { email: decoded.email } });

    if (!user) {
      return res.send(`
        <html><body style="font-family: Arial; text-align: center; margin-top: 50px;">
        <h2>⚠️ User not found</h2>
        <a href="/login"><button style="padding: 10px 20px; margin-top: 20px;">Go to Login</button></a>
        </body></html>
      `);
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await User.update({ password: hashedPassword, resetToken: null }, { where: { email: decoded.email } });

    return res.send(`
      <html>
        <head>
          <style>
            body { font-family: Arial; background-color: #f4f4f4; display: flex; justify-content: center; align-items: center; height: 100vh; }
            .card { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center; }
            .btn { background-color: #007BFF; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>✅ Password Reset Successfully</h2>
            <p>You can now log in with your new password.</p>
            <a href="/login" class="btn">Login</a>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error(error);
    return res.send(`
      <html><body style="font-family: Arial; text-align: center; margin-top: 50px; color: red;">
      <h2>❌ Invalid or expired reset token.</h2>
      <a href="/forgot-password"><button style="padding: 10px 20px; margin-top: 20px;">Try Again</button></a>
      </body></html>
    `);
  }
};
