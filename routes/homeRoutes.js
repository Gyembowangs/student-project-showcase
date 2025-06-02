const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');


// Home route (only accessible by logged-in users)
router.get('/home', isAuthenticated, (req, res) => {
    res.render('user/home',{ session: req.session })
});


// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login'); // Redirect to login after logout
    });
});


module.exports = router;