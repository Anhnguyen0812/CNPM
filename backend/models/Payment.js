const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  card_number: {
    type: DataTypes.STRING(255),
    // Note: In production, store only last 4 digits or a token
  },
  card_name: {
    type: DataTypes.STRING(255)
  },
  cvv: {
    type: DataTypes.STRING(10)
    // Note: In production, don't store CVV at all for PCI compliance
  },
  expire_month: {
    type: DataTypes.STRING(2)
  },
  expire_year: {
    type: DataTypes.STRING(4)
  },
  type: {
    type: DataTypes.INTEGER
    // 0 for card, 1 for e-wallet, etc.
  },
  timestamp: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'payments',
  timestamps: false
});

module.exports = Payment;