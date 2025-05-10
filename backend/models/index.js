const User = require('./User');
const Vehicle = require('./Vehicle');
const Payment = require('./Payment');
const ActivityChain = require('./ActivityChain');
const Activity = require('./Activity');
const Group = require('./Group');
const Member = require('./Member');
const Booking = require('./Booking');
const { sequelize } = require('../config/database.config');

// Define relationships between models

// User - Vehicle relationship (One-to-Many)
User.hasMany(Vehicle, { foreignKey: 'user_id' });
Vehicle.belongsTo(User, { foreignKey: 'user_id' });

// User - Payment relationship (One-to-Many)
User.hasMany(Payment, { foreignKey: 'user_id' });
Payment.belongsTo(User, { foreignKey: 'user_id' });

// User - ActivityChain relationship (One-to-Many)
User.hasMany(ActivityChain, { foreignKey: 'user_id' });
ActivityChain.belongsTo(User, { foreignKey: 'user_id' });

// ActivityChain - Activity relationship (One-to-Many)
ActivityChain.hasMany(Activity, { foreignKey: 'activity_chain_id' });
Activity.belongsTo(ActivityChain, { foreignKey: 'activity_chain_id' });

// ActivityChain - Group relationship (Many-to-One)
ActivityChain.belongsTo(Group, { foreignKey: 'group_id' });
Group.hasMany(ActivityChain, { foreignKey: 'group_id' });

// User - Member relationship (One-to-Many)
User.hasMany(Member, { foreignKey: 'user_id' });
Member.belongsTo(User, { foreignKey: 'user_id' });

// Group - Member relationship (One-to-Many)
Group.hasMany(Member, { foreignKey: 'group_id' });
Member.belongsTo(Group, { foreignKey: 'group_id' });

// User - Booking relationship (One-to-Many)
User.hasMany(Booking, { foreignKey: 'user_id' });
Booking.belongsTo(User, { foreignKey: 'user_id' });

// Group - Booking relationship (One-to-Many)
Group.hasMany(Booking, { foreignKey: 'group_id' });
Booking.belongsTo(Group, { foreignKey: 'group_id' });

// Payment - Booking relationship (One-to-Many)
Payment.hasMany(Booking, { foreignKey: 'payment_id' });
Booking.belongsTo(Payment, { foreignKey: 'payment_id' });

module.exports = {
  User,
  Vehicle,
  Payment,
  ActivityChain,
  Activity,
  Group,
  Member,
  Booking,
  sequelize
};