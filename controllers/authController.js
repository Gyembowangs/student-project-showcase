const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const User = require('../models/User'); // your Sequelize User model

const saltRounds = 10;

// Email transporter setup (reuse for all email sends)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // ✅ Check if login is for admin using plain-text .env credentials
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(
        { email, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Set session and cookie for admin
      req.session.user = {
        email,
        isAdmin: true,
        role: 'admin'
      };
      res.cookie('jwt', token, { httpOnly: true });

      return res.redirect('/admin/adminDashboard');
    }

    // 🔐 Normal user login from DB
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.render('pages/login', { message: 'Invalid credentials!' });
    }

    if (!user.isVerified) {
      return res.render('pages/login', { message: 'Please verify your email first.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('pages/login', { message: 'Invalid credentials!' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    req.session.user = {
      id: user.id,
      email: user.email,
      isAdmin: user.role === 'admin',
      role: user.role
    };
    res.cookie('jwt', token, { httpOnly: true });

    if (user.role === 'admin') {
      return res.redirect('/admin/adminDashboard');
    } else {
      return res.redirect('/user/home');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('pages/login', { message: 'Error during login.' });
  }
};

// Renders login form
exports.getLogin = (req, res) => {
  res.render('pages/login', { message: null });
};

// Renders signup form
exports.getSignup = (req, res) => {
  res.render('pages/signup', { message: null });
};

// Handles signup form
exports.postSignup = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.render('pages/signup', { message: '⚠️ Email already registered!' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const verificationToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create user in the database
    await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'guest',
      verificationToken,
      isVerified: false,
    });

    // Email verification link
    const verifyUrl = `http://localhost:3000/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    // Send verification email
   await transporter.sendMail({
    from: `"Sherubtse Student Project Showcase" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '📩 Please verify your email',
    html: `
      <h3>Hello ${firstName},</h3>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}" target="_blank" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; margin-bottom: 15px;">Verify Email</a>
      <p>This link expires in 1 hour.</p>
    `,
  });

    // Show success message and redirect to login
    return res.render('pages/verify-message', {
      email,
      firstName,
    });

  } catch (error) {
    console.error('Signup Error:', error);
    return res.render('pages/signup', {
      message: '❌ Error during signup. Please try again.',
    });
  }
};
// Email verification route
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    // Update user to mark verified and clear token
    await User.update(
      { isVerified: true, verificationToken: null },
      { where: { email } }
    );

    // Send success message with a login button
    res.send(`
      <html>
        <head>
          <title>Email Verified</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin-top: 50px;
            }
            .btn {
              background-color: #4CAF50;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              font-size: 16px;
              border-radius: 6px;
              display: inline-block;
              margin-top: 20px;
            }
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
        <head>
          <title>Verification Failed</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin-top: 50px;
              color: red;
            }
          </style>
        </head>
        <body>
          <h2>❌ Invalid or expired verification link.</h2>
        </body>
      </html>
    `);
  }
};


// Renders forgot password page
exports.getForgotPassword = (req, res) => {
  res.render('pages/forgot-password', { message: null });
};

// Sends a password reset link to the user email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.render('pages/forgot-password', { message: 'Email not found' });
    }

    // Generate a password reset token (expires in 1 hour)
    const resetToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Store the reset token in the database
    await User.update(
      { resetToken },
      { where: { email } }
    );

    // Send email with reset link
    const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Sherubtse Student Project Showcase" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      text: `Click the link below to reset your password:\n\n${resetLink}`,
    };

    await transporter.sendMail(mailOptions);
    res.render('pages/forgot-password', { message: 'Password reset link has been sent to your email.' });

  } catch (error) {
    console.error(error);
    res.render('pages/forgot-password', { message: 'Something went wrong. Please try again.' });
  }
};

// Renders reset password page
exports.getResetPassword = (req, res) => {
  const { token } = req.query;
  res.render('pages/reset-password', { token, message: null });
};

// Reset password
// Reset password
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ where: { email: decoded.email } });

    if (!user) {
      return res.send(`
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
              }
              .card {
                border: 1px solid #ccc;
                border-radius: 10px;
                padding: 30px;
                text-align: center;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              }
              .btn {
                margin-top: 20px;
                background-color: #4CAF50;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>⚠️ User not found</h2>
              <a href="/login"><button class="btn">Go to Login</button></a>
            </div>
          </body>
        </html>
      `);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await User.update(
      { password: hashedPassword, resetToken: null },
      { where: { email: decoded.email } }
    );

    // Send success card
    return res.send(`
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background-color: #f4f4f4;
            }
            .card {
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              text-align: center;
            }
            .btn {
              margin-top: 20px;
              background-color: #007BFF;
              color: white;
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>✅ Password Reset Successfully</h2>
            <p>You can now log in with your new password.</p>
            <a href="/login"><button class="btn">OK</button></a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    return res.send(`
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }
            .card {
              border: 1px solid red;
              border-radius: 10px;
              padding: 30px;
              text-align: center;
              box-shadow: 0 2px 10px rgba(255, 0, 0, 0.2);
            }
            .btn {
              margin-top: 20px;
              background-color: red;
              color: white;
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>❌ Invalid or expired token</h2>
            <a href="/login"><button class="btn">Go to Login</button></a>
          </div>
        </body>
      </html>
    `);
  }
};


exports.logout = (req, res) => {
  console.log('🔁 Logout route hit');
  res.clearCookie('jwt', { httpOnly: true, path: '/' });
  res.send('Logged out');
};



