const express = require('express');
 const router = express.Router();
 // Render the landing page
 router.get('/', (req, res) => {
 res.render('pages/index', { title: 'Student project showcase' });
 });
 module.exports = router;