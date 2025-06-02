const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('users', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100], // password must be between 6 and 100 chars
    },
  },
  role: {
    type: DataTypes.ENUM,
    values: ['student', 'lecturer', 'guest'],
    allowNull: false,
  },
  course: {
    type: DataTypes.STRING,
    allowNull: true, // Only required for 'student' role
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verificationToken: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'users',
  timestamps: true,
  freezeTableName: true, // avoid pluralizing table name
});

module.exports = User;
