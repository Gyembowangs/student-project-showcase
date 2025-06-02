const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');
const Rating = require('./Rating');
const Comment = require('./Comment');

// Project & Rating association
Project.hasMany(Rating, { foreignKey: 'projectId', onDelete: 'CASCADE', hooks: true });
Rating.belongsTo(Project, { foreignKey: 'projectId' });

// Project & Comment association
Project.hasMany(Comment, { foreignKey: 'projectId', onDelete: 'CASCADE', hooks: true });
Comment.belongsTo(Project, { foreignKey: 'projectId' });

// User & Project association
User.hasMany(Project, { foreignKey: 'userId', as: 'projects', onDelete: 'CASCADE', hooks: true });
Project.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User & Comment association
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments', onDelete: 'CASCADE', hooks: true });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User & Rating association (added)
User.hasMany(Rating, { foreignKey: 'userId', as: 'ratings', onDelete: 'CASCADE', hooks: true });
Rating.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Sync the database (optional: remove in production)
sequelize.sync({ force: false })
  .then(() => {
    console.log('Database synced successfully!');
  })
  .catch((error) => {
    console.error('Error syncing the database:', error);
  });

module.exports = {
  sequelize,
  User,
  Project,
  Rating,
  Comment,
};
