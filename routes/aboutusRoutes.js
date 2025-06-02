const express = require('express');
const router = express.Router();

// Route for About Us page
router.get('/aboutus', (req, res) => {
  res.render('user/aboutus'); // this will render views/aboutus.ejs
});

module.exports = router;
