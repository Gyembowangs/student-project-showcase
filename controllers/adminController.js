const { Project, Comment, Rating, User } = require('../models');
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
// controllers/adminController.js
module.exports.renderDashboard = (req, res) => {
  res.render('admin/adminDashboard'); // Render the admin dashboard page
};

module.exports.renderProjectManagement = (req, res) => {
  // You can pass data to the page if needed
  res.render('admin/projectManagement');
};

module.exports.renderUserManagement = (req, res) => {
  res.render('admin/userManagement');
};

exports.getAdminDashboardStats = async (req, res) => {
  try {
    const totalProjects = await Project.count();
    const pendingProjects = await Project.count();
    const totalComments = await Comment.count();
    const totalRatings = await Rating.count();
    const totalUsers = await User.count();

    res.render('admin/adminDashboard', {
      stats: {
        totalProjects,
        pendingProjects,
        totalComments,
        totalRatings,
        totalUsers,
      },
    });
  } catch (err) {
    console.error('❌ Error fetching admin stats:', err);
    res.status(500).send('Error loading dashboard');
  }
};

function calculateAverageRating(ratings) {
  if (ratings.length === 0) return 'No ratings';
  const totalRating = ratings.reduce((sum, rating) => sum + rating.ratingValue, 0);
  return (totalRating / ratings.length).toFixed(1);
}
exports.getAdminProjectManagement = async (req, res) => {
  try {
    // Admin check
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).send('Access denied. Admins only.');
    }

    const projects = await Project.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: Rating,
          attributes: ['ratingValue'],
        },
        {
          model: Comment,
          attributes: ['id'],
        }
      ]
    });

    // Helper function to clean and split strings into arrays
    const parseAndCleanList = (data) => {
      if (!data || typeof data !== 'string') return [];

      try {
        // Attempt to parse JSON array
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.map(item => item.trim().replace(/^"|"$/g, ''));
        }
      } catch (err) {
        // Fallback to comma-split if not valid JSON
        return data.split(',')
                   .map(item => item.trim().replace(/^"|"$/g, ''))
                   .filter(Boolean);
      }

      return [];
    };

    const formattedProjects = projects.map(p => {
      const proj = p.toJSON();
      proj.averageRating = calculateAverageRating(proj.Ratings);
      proj.commentCount = proj.Comments.length;

      // Clean up file names and links
      proj.additionalFiles = parseAndCleanList(proj.additionalFiles);
      proj.projectLinks = parseAndCleanList(proj.projectLinks);

      return proj;
    });

    res.render('admin/projectManagement', {
      projects: formattedProjects,
      adminUser: req.session.user
    });

  } catch (error) {
    console.error('❌ Error fetching admin projects:', error);
    res.status(500).send('Error fetching projects for admin');
  }
};
exports.approveProject = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).send('Access denied. Admins only.');
    }

    const projectId = req.params.id;
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).send('Project not found');
    }

    project.status = 'approved';
    await project.save();

    res.redirect('/admin/projectManagement');
  } catch (error) {
    console.error('❌ Error approving project:', error);
    res.status(500).send('Failed to approve project');
  }
};

exports.rejectProject = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).send('Access denied. Admins only.');
    }

    const projectId = req.params.id;
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).send('Project not found');
    }

    project.status = 'rejected';
    await project.save();

    res.redirect('/admin/projectManagement');
  } catch (error) {
    console.error('❌ Error rejecting project:', error);
    res.status(500).send('Failed to reject project');
  }
};

exports.deleteProject = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).send('Access denied. Admins only.');
    }

    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).send('Project ID is required.');
    }

    const project = await Project.findOne({ where: { id: projectId } });
    if (!project) {
      return res.status(404).send('Project not found');
    }

    // Delete associated ratings and comments
    await Rating.destroy({ where: { projectId } });
    await Comment.destroy({ where: { projectId } });

    // Delete main project image/file if present
    if (project.projectImage) {
      const filePath = path.join(__dirname, '..', 'public', 'uploads', project.projectImage);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted project image: ${filePath}`);
      }
    }

    // Delete additional files
    if (project.additionalFiles) {
      try {
        const files = JSON.parse(project.additionalFiles);
        files.forEach(filename => {
          const filepath = path.join(__dirname, '..', 'public', 'uploads', filename);
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            console.log(`🗑️ Deleted additional file: ${filepath}`);
          }
        });
      } catch (err) {
        console.error('❌ Error parsing additionalFiles JSON:', err);
      }
    }

    // Delete the project
    await Project.destroy({ where: { id: projectId } });

    res.redirect('/admin/projectManagement');

  } catch (error) {
    console.error('❌ Error deleting project:', error);
    res.status(500).send('Failed to delete the project');
  }
};
// GET all users for user-management page
exports.getUserManagement = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).send('Access denied. Admins only.');
    }

    const users = await User.findAll({
      where: { isVerified: true },  // <-- Only verified users
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'course', 'isVerified', 'createdAt']
    });

    res.render('admin/userManagement', { users, adminUser: req.session.user });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).send('Failed to load user management');
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).send('Access denied.');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    await user.destroy();
    console.log(`🗑️ Deleted user with ID: ${userId}`);

    res.redirect('/admin/userManagement');
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).send('Error deleting user');
  }
};
