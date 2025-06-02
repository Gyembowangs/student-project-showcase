const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const projectController = require('../controllers/projectController');
router.get('/user/projects', projectController.getAllProjects);
router.get('/user/upload', (req, res) => {
  res.render('user/upload'); // Make sure this view exists
});

// ✅ Upload project (clean and delegated to controller)
router.post(
  '/upload-project',
  projectController.upload,
  (req, res, next) => {
    console.log("✅ /upload-project route hit");
    next();
  },
  projectController.uploadProject
);

// ✅ Download uploaded file
router.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(__dirname, '..', 'public', 'uploads', req.params.filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('File not found:', err);
      return res.status(404).send('File not found');
    }

    res.download(filePath);
  });
});

router.get('/projects/:id', projectController.getProjectDetails);


// POST a comment to a specific project
router.post('/projects/:id/comment', projectController.addComment);

// POST a rating to a specific project
router.post('/projects/:id/rate', projectController.rateProject);
module.exports = router;
