const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  activity_chain_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  activity_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  activity_time: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  start_place: {
    type: DataTypes.STRING(255)
  },
  start_lat: {
    type: DataTypes.DOUBLE
  },
  start_lon: {
    type: DataTypes.DOUBLE
  },
  end_place: {
    type: DataTypes.STRING(255)
  },
  end_lat: {
    type: DataTypes.DOUBLE
  },
  end_lon: {
    type: DataTypes.DOUBLE
  },
  duration: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  type: {
    type: DataTypes.INTEGER,
    defaultValue: 0
    // 0 for fixed location, 1 for flexible location
  },
  sequence_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  timestamp: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  // New fields for ride-sharing
  is_flexible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  poi_category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  matched_activity_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'activities',
  timestamps: false
});

module.exports = Activity;