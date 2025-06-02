// models/Project.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  projectTitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  projectDescription: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  projectImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  additionalFiles: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  projectLinks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
}, {
  tableName: 'projects',
  timestamps: true,
});

module.exports = Project;
