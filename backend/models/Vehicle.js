const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  vehicle_name: {
    type: DataTypes.STRING(255)
  },
  vehicle_number: {
    type: DataTypes.STRING(50),
    unique: true
  },
  vehicle_color: {
    type: DataTypes.STRING(50)
  },
  vehicle_image: {
    type: DataTypes.STRING(2048)
  },
  vehicle_type: {
    type: DataTypes.STRING(100)
  },
  timestamp: {
    type: DataTypes.BIGINT,
    allowNull: false
  }
}, {
  tableName: 'vehicles',
  timestamps: false
});

module.exports = Vehicle;