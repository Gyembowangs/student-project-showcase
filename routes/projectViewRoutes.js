const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// GET all projects
router.get('/projects', projectController.getAllProjects);

// GET single project by ID
router.get('/projects/:id', projectController.getProjectDetails);


// POST a comment to a specific project
router.post('/projects/:id/comment', projectController.addComment);

// POST a rating to a specific project
router.post('/projects/:id/rate', projectController.rateProject);

module.exports = router;
