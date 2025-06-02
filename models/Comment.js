const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
  commentText: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'comments',
  timestamps: true
});

module.exports = Comment;
