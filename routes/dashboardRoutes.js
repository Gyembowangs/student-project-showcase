const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Import middleware to ensure user is logged in
const { isAuthenticated } = require('../middleware/authMiddleware');

// Route: GET /dashboard
router.get('/dashboard', isAuthenticated, dashboardController.getDashboard);  

// Route: GET /dashboard/projects/:projectId/comments
router.get('/projects/:projectId/comments', isAuthenticated, dashboardController.getProjectComments);

// ✅ Route: DELETE /dashboard/projects/:projectId (to delete a project)
router.delete('/projects/:projectId/delete', isAuthenticated, dashboardController.deleteProject);

module.exports = router;
