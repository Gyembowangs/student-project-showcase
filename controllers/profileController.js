const Profile = require('../models/Profile');

// CREATE profile
exports.createProfile = async (req, res) => {
  try {
    const { name, age, course, contact, email } = req.body;

    // Prepare profile data
    const profileData = {
      name,
      age,
      course,
      contact,
      email,
      profile_image: req.file ? req.file.filename : null,
    };

    const newProfile = await Profile.create(profileData);

    // Save profile to session
    req.session.profile = newProfile;

    res.status(201).json({
      message: 'Profile created successfully!',
      profile: newProfile,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET all profiles
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.findAll();
    res.status(200).json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET single profile by ID
exports.getProfileById = async (req, res) => {
  try {
    const profile = await Profile.findByPk(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE profile by ID
exports.updateProfile = async (req, res) => {
  try {
    const profile = await Profile.findByPk(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const { name, age, course, contact, email } = req.body;

    const updatedData = {
      name,
      age,
      course,
      contact,
      email,
    };

    if (req.file) {
      updatedData.profile_image = req.file.filename;
    }

    await profile.update(updatedData);

    // Update session profile
    req.session.profile = profile;

    res.status(200).json({
      message: 'Profile updated successfully!',
      profile,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE profile by ID
exports.deleteProfile = async (req, res) => {
  try {
    const profile = await Profile.findByPk(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    await profile.destroy();

    res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
