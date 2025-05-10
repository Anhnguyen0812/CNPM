const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  uid: {
    type: DataTypes.STRING(255),
    unique: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  url: {
    type: DataTypes.STRING(2048)
  },
  phone: {
    type: DataTypes.STRING(20),
    unique: true
  },
  email: {
    type: DataTypes.STRING(255),
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  vehicle_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.BIGINT,
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: false
});

module.exports = User;