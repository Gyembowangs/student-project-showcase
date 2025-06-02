const fs = require('fs');
const path = require('path');
const { Project, Rating, Comment, User } = require('../models');
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');
function calculateAverageRating(ratings) {
  if (ratings.length === 0) return 'No ratings';
  const totalRating = ratings.reduce((sum, rating) => sum + rating.ratingValue, 0);
  return (totalRating / ratings.length).toFixed(1);
}

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.session?.user?.id || req.user?.id || req.body.userId;

    if (!userId) {
      console.error("❌ Missing userId");
      return res.status(400).json({ error: 'User ID is missing or not authenticated.' });
    }

    // Fetch projects for the current user with the associated ratings and comments
    const projects = await Project.findAll({
      where: { userId },
      include: [
        {
          model: Rating,
          attributes: ['ratingValue'],
        },
        {
          model: Comment,
          attributes: ['id', 'commentText'],
        }
      ]
    });

    // Format the projects
    const formattedProjects = projects.map(p => {
      const proj = p.toJSON();
      proj.averageRating = calculateAverageRating(proj.Ratings);
      return proj;
    });

    res.render('user/dashboard', { projects: formattedProjects });
  } catch (error) {
    console.error('❌ Error fetching dashboard projects:', error);
    res.status(500).send('Error fetching dashboard projects');
  }
};

// 2. Get comments for a specific project
exports.getProjectComments = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    console.log('🔍 Project ID:', projectId);

    if (!projectId) {
      return res.status(400).render('errorPage', { message: 'Project ID is required' });
    }

    // Fetch comments with associated user details
    const comments = await Comment.findAll({
      where: { projectId },
      include: [
        {
          model: User,
          as: 'user', // Make sure this alias matches your association!
          attributes: [ 'email']
        }
      ]
    });

    res.render('viewComments', { comments, projectId }); // Pass to EJS page

  } catch (error) {
    console.error('❌ Error fetching comments:', error);
    res.status(500).render('errorPage', { message: 'Error fetching comments' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    console.log("🔍 Project ID to delete:", projectId);

    if (!projectId) {
      console.error("❌ Project ID is missing");
      return res.status(400).send('Project ID is required.');
    }

    // Check if the project exists
    const project = await Project.findOne({ where: { id: projectId } });

    if (!project) {
      return res.status(404).send('Project not found');
    }

    // 1. Delete associated ratings
    await Rating.destroy({ where: { projectId } });

    // 2. Delete associated comments
    await Comment.destroy({ where: { projectId } });

    // 3. Optionally, delete project image file (if applicable)
    if (project.projectFilePath) {
      const filePath = path.join(__dirname, '..', 'uploads', project.projectFilePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted project file: ${filePath}`);
      }
    }

    // 4. Now delete the project itself
    await Project.destroy({ where: { id: projectId } });

    res.redirect('/user/dashboard');

  } catch (error) {
    console.error('❌ Error deleting project:', error);
    res.status(500).send('Failed to delete the project');
  }
};
