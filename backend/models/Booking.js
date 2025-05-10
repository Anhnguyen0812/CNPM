const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  payment_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false
    // 0: Pending, 1: Confirmed, 2: Cancelled_by_user, 3: Cancelled_by_driver, 4: Completed
  },
  type: {
    type: DataTypes.INTEGER
    // Could denote booking type if needed
  },
  booking_timestamp: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  pickup_location_name: {
    type: DataTypes.STRING(255)
  },
  pickup_lat: {
    type: DataTypes.DOUBLE
  },
  pickup_lon: {
    type: DataTypes.DOUBLE
  },
  dropoff_location_name: {
    type: DataTypes.STRING(255)
  },
  dropoff_lat: {
    type: DataTypes.DOUBLE
  },
  dropoff_lon: {
    type: DataTypes.DOUBLE
  },
  fare: {
    type: DataTypes.DECIMAL(10, 2)
  }
}, {
  tableName: 'bookings',
  timestamps: false
});

module.exports = Booking;