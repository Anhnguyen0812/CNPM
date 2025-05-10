const express = require('express');
const cors = require('cors');
const { sequelize, testConnection } = require('./config/database.config');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const activityChainRoutes = require('./routes/activity-chain.routes');
const groupRoutes = require('./routes/group.routes');
const bookingRoutes = require('./routes/booking.routes');

// Initialize Express app
const app = express();

// Test database connection
testConnection();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Ride Sharing API' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/activities', activityChainRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/bookings', bookingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 Not Found middleware
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;