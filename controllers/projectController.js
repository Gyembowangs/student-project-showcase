const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { sequelize, Project, Rating, Comment } = require('../models');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

exports.upload = multer({
  storage: storage
}).fields([
  { name: 'projectImage', maxCount: 1 },
  { name: 'additionalFiles' }
]);
exports.uploadProject = async (req, res) => {
  try {
    const { projectTitle, projectDescription, projectLinks } = req.body;
    const userId = req.session?.user?.id || req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is missing or not authenticated.' });
    }

    let additionalFiles = [];
    if (req.files?.additionalFiles) {
      additionalFiles = req.files.additionalFiles.map(file => file.filename);
    }

    const projectImage = req.files?.projectImage?.[0]?.filename || null;

    const project = await Project.create({
      projectTitle,
      projectDescription,
      projectLinks,
      userId,
      projectImage,
      additionalFiles: JSON.stringify(additionalFiles),
      status: 'pending'
    });

    console.log("✅ Project uploaded:", project.id);
    res.status(201).json({ message: "Project uploaded successfully. Awaiting admin approval.", project });
  } catch (err) {
    console.error("❌ Error uploading project:", err);
    res.status(500).json({ error: 'Failed to upload project. Please try again.', details: err.message });
  }
};

// 2. Get all approved projects (for public listing)
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { status: 'approved' }, // Only show approved projects
      include: [
        {
          model: Rating,
          attributes: []
        },
        {
          model: require('../models').User,
          as: 'user',
          attributes: ['course', 'firstName', 'lastName']
        }
      ],
      attributes: {
        include: [
          [sequelize.fn('AVG', sequelize.col('Ratings.ratingValue')), 'averageRating']
        ]
      },
      group: ['Project.id', 'user.id']
    });

    const formattedProjects = projects.map(p => {
      const proj = p.toJSON();
      proj.averageRating = proj.averageRating ? parseFloat(proj.averageRating).toFixed(1) : 'No ratings';
      return proj;
    });

    res.render('user/projects', { projects: formattedProjects });
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    res.status(500).send('Error fetching projects');
  }
};

// 3. Get single project details (only if approved)
exports.getProjectDetails = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      return res.status(400).send('Invalid project ID');
    }

    const project = await Project.findOne({
      where: { id: projectId, status: 'approved' } // Only show if accepted
    });

    if (!project) {
      return res.status(404).send('Project not found or not approved by admin');
    }

    let additionalFiles = [];
    if (project.additionalFiles) {
      try {
        const parsedFiles = JSON.parse(project.additionalFiles);
        if (Array.isArray(parsedFiles)) {
          additionalFiles = parsedFiles.filter(filename => {
            const filepath = path.join(__dirname, '..', 'public', 'uploads', filename);
            return fs.existsSync(filepath);
          });
        }
      } catch (parseError) {
        console.error('❌ Error parsing additionalFiles JSON:', parseError);
      }
    }

    const comments = await Comment.findAll({ where: { projectId } });
    const ratings = await Rating.findAll({ where: { projectId } });

    const averageRating = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.ratingValue, 0) / ratings.length).toFixed(1)
      : null;

    res.render('user/project-detail', { project, additionalFiles, comments, averageRating });
  } catch (err) {
    console.error('❌ Error fetching project details:', err);
    res.status(500).send('Server Error');
  }
};

// 4. Rate a project
exports.rateProject = async (req, res) => {
  try {
    const { ratingValue } = req.body;
    const { id: projectId } = req.params;

    if (!ratingValue || !projectId) {
      return res.status(400).json({ error: 'Missing required fields: ratingValue or projectId' });
    }

    if (ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const project = await Project.findByPk(projectId);
    if (!project || project.status !== 'approved') {
      return res.status(403).json({ error: 'You can only rate approved projects' });
    }

    await Rating.create({ ratingValue, projectId });

    const projectRatings = await Rating.findAll({
      where: { projectId },
      attributes: [[sequelize.fn('AVG', sequelize.col('ratingValue')), 'averageRating']],
    });

    const averageRatingRaw = projectRatings[0].get('averageRating');
    const averageRating = averageRatingRaw ? parseFloat(averageRatingRaw).toFixed(1) : null;

    await Project.update({ averageRating }, { where: { id: projectId } });

    res.status(200).json({ message: 'Rating added successfully', averageRating });
  } catch (error) {
    console.error('❌ Error rating project:', error);
    res.status(500).json({ error: 'An error occurred while rating the project' });
  }
};

// 5. Add a comment (only if project is accepted)
exports.addComment = async (req, res) => {
  try {
    const { commentText, projectId } = req.body;

    if (!commentText || !projectId) {
      return res.status(400).json({ message: 'Missing required fields: commentText or projectId' });
    }

    const project = await Project.findByPk(projectId);
    if (!project || project.status !== 'approved') {
      return res.status(403).json({ message: 'You can only comment on approved projects' });
    }

    const newComment = await Comment.create({ commentText, projectId });

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });

  } catch (error) {
    console.error('❌ Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
};
