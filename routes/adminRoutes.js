const express = require('express');
const router = express.Router();

// Controllers
const adminController = require('../controllers/adminController');

// Middlewares
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// Admin dashboard stats route (assuming it exists in your adminController)
router.get('/adminDashboard', isAuthenticated, isAdmin, adminController.getAdminDashboardStats);

// Admin project management page - loads project data from controller and renders view
router.get('/projectManagement', isAuthenticated, isAdmin, adminController.getAdminProjectManagement);
router.post('/projects/:id/approve', adminController.approveProject);
router.post('/projects/:id/reject', adminController.rejectProject);

// Delete a project by id
router.post('/projects/delete/:projectId', isAuthenticated, isAdmin, adminController.deleteProject);

router.get('/userManagement', adminController.getUserManagement);
router.post('/userManagement/delete/:id', adminController.deleteUser);
// Admin user management page (just rendering the view for now)
router.get('/userManagement', isAuthenticated, isAdmin, (req, res) => {
  res.render('userManagement');
});

module.exports = router;
