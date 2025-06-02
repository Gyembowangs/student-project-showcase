const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Project = require('./Project'); // Make sure Project model is imported for association

const Rating = sequelize.define('Rating', {
  ratingValue: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    }
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  tableName: 'ratings', // Optional: you can customize the table name
  timestamps: true,      // Adds createdAt & updatedAt fields
});

// Associations
Rating.belongsTo(Project, { foreignKey: 'projectId' });
Project.hasMany(Rating, { foreignKey: 'projectId' });

module.exports = Rating;
