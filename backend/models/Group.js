const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const Group = sequelize.define('Group', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  start_timestamp: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  limit_passenger: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.INTEGER
    // 0 for activity-based match, 1 for trajectory-based match
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 0
    // 0: Open, 1: Full, 2: In Progress, 3: Completed, 4: Cancelled
  },
  timestamp: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  origin_name: {
    type: DataTypes.STRING(255)
  },
  origin_lat: {
    type: DataTypes.DOUBLE
  },
  origin_lon: {
    type: DataTypes.DOUBLE
  },
  destination_name: {
    type: DataTypes.STRING(255)
  },
  destination_lat: {
    type: DataTypes.DOUBLE
  },
  destination_lon: {
    type: DataTypes.DOUBLE
  },
  route_polyline: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'groups_',
  timestamps: false
});

module.exports = Group;