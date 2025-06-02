const jwt = require('jsonwebtoken');


// Protects routes for users with 'admin' role
exports.isAdmin = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) return res.redirect('/login');


  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.redirect('/login');
    if (decoded.role !== 'admin') return res.redirect('/user/dashboard');
    next();
  });
};


// Protects routes for users (admin or user)
exports.isAuthenticated = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) return res.redirect('/login');


  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.redirect('/login');
    req.user = decoded;
    next();
  });
};



