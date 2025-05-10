const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const ActivityChain = sequelize.define('ActivityChain', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255)
  },
  timestamp: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  is_driver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_passenger: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  vehicle_details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  passenger_preferences: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  matched_driver_chain_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  match_timestamp: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'activity_chains',
  timestamps: false
});

module.exports = ActivityChain;