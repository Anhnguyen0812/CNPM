const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const Member = sequelize.define('Member', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  uid: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING(50),
    defaultValue: 'passenger'
  },
  join_timestamp: {
    type: DataTypes.BIGINT,
    allowNull: false
  }
}, {
  tableName: 'members',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'group_id']
    }
  ]
});

module.exports = Member;