const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');

// Configure multer
const upload = multer({ dest: 'uploads/' });

// Create or update profile
router.post('/profile/:id', upload.single('profileImage'), async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  const profileImage = req.file ? req.file.filename : null;

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.update({ name, email, profileImage });
    res.status(200).json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

module.exports = router;
