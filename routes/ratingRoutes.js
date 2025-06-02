const express = require('express');
const { Rating, Project } = require('../models');
const router = express.Router();

// Add a new rating
router.post('/add-rating', async (req, res) => {
  try {
    const { ratingValue, projectId } = req.body;

    // Check if the required fields are present in the request body
    if (!ratingValue || !projectId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate rating value (it should be between 1 and 5)
    if (ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Create the rating entry in the database
    const newRating = await Rating.create({
      ratingValue,
      projectId, // Only store projectId and ratingValue
    });

    // Calculate the average rating for the project
    const ratings = await Rating.findAll({
      where: { projectId },
    });

    const averageRating = ratings.length
      ? (ratings.reduce((sum, rating) => sum + rating.ratingValue, 0) / ratings.length).toFixed(1)
      : 0;

    // Optionally, you can update the project with the new average rating if you want
    await Project.update({ averageRating }, { where: { id: projectId } });

    // Respond with the newly created rating entry and the updated average rating
    res.status(201).json({
      message: 'Rating submitted successfully',
      rating: newRating,
      averageRating,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating rating' });
  }
});

module.exports = router;
