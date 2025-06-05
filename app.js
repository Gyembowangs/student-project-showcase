// app.js

// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

// External imports
const express = require('express');
const path = require('path');
const session = require('express-session');
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');

// Internal imports
const sequelize = require('./config/database');
const { isAuthenticated } = require('./middleware/authMiddleware');

// Models
const User = require('./models/User');
const Project = require('./models/Project');
const Comment = require('./models/Comment');
const Rating = require('./models/Rating');

// Express app
const app = express();

// Set port
const PORT = process.env.PORT || 3015;

// Trust proxy in production
if (process.env.NODE_ENV === "pr oduction") {
  app.set("trust proxy", 1);
}

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

// Cookie parser
app.use(cookieParser());

// Method override for forms
app.use(methodOverride('_method'));

// Session store setup
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: "Session",
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000,
});

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecretKey',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000,
  },
}));

// Make session accessible in EJS templates
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

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

// Example protected route
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

// Initialize database and start server
sequelize.authenticate()
  .then(() => {
    console.log('✅ PostgreSQL connected!');
    return sequelize.sync({ alter: true });
  })
  .then(() => sessionStore.sync())
  .then(() => {
    console.log("✅ Sequelize models and session store synced!");
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Error syncing database or session store:", error);
  });
