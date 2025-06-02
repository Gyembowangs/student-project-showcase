const express = require('express');
const { addComment } = require('../controllers/projectController'); // Import the controller
const router = express.Router();

// POST route to add a comment
router.post('/add-comment', addComment);

module.exports = router;
