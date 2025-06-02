// app.js

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const methodOverride = require('method-override');
const sequelize = require('./config/database');
const { isAuthenticated, isAdmin } = require('./middleware/authMiddleware');
const cookieParser = require('cookie-parser');
// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3015;

// Load models
const User = require('./models/User');
const Project = require('./models/Project');
const Comment = require('./models/Comment');
const Rating = require('./models/Rating');

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/components', express.static(path.join(__dirname, 'views/components')));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000
  }
}));

// Make session accessible in templates
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Method override for forms
app.use(methodOverride('_method'));

app.use(cookieParser());
// Sync Sequelize models
sequelize.authenticate()
  .then(() => {
    console.log('✅ PostgreSQL connected!');
    return sequelize.sync({ alter: true });
  })
  .then(() => console.log('✅ Sequelize models synced with the database'))
  .catch(err => console.error('❌ DB connection or sync error:', err));

// Import routes
const indexRoutes = require('./routes/indexRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const homeRoutes = require('./routes/homeRoutes');
const aboutusRoutes = require('./routes/aboutusRoutes');
const projectRoutes = require('./routes/projectRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');
const commentRoutes = require('./routes/commentRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

// Register routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/user', homeRoutes);
app.use('/user', aboutusRoutes);
app.use('/', projectRoutes);
app.use('/user', dashboardRoutes);
app.use('/user', userRoutes);
app.use('/comments', commentRoutes);
app.use('/ratings', ratingRoutes);

// Protected route example
app.get('/protected', isAuthenticated, (req, res) => {
  res.send(`Hello ${req.session.user.firstName}, you are authenticated!`);
});

// DB test route
app.get('/db-test', async (req, res) => {
  try {
    const result = await sequelize.query('SELECT NOW() AS current_time');
    res.json({ message: 'Database connected successfully', time: result[0][0].current_time });
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});



// 404 handler
app.use((req, res) => {
  res.status(404).send('404: Page not found');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
