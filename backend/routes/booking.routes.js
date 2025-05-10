const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes in this file require authentication
router.use(authenticate);

// Booking routes
router.post('/', bookingController.createBooking);
router.get('/:bookingId', bookingController.getBookingById);
router.patch('/:bookingId/status', bookingController.updateBookingStatus);

// User booking history
router.get('/user/me', bookingController.getUserBookings);

// Group bookings (for drivers)
router.get('/group/:groupId', bookingController.getGroupBookings);

module.exports = router;