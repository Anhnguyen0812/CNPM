const bookingService = require('../services/booking.service');

/**
 * Create a new booking
 */
const createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingData = req.body;
    
    const booking = await bookingService.createBooking(bookingData, userId);
    
    return res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    
    if (error.message === 'Group not found') {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (error.message === 'Group is not open for bookings') {
      return res.status(400).json({ message: 'Group is not open for bookings' });
    }
    if (error.message === 'Group is full') {
      return res.status(400).json({ message: 'Group is full' });
    }
    if (error.message === 'User is already a member of this group') {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }
    if (error.message === 'Invalid payment method') {
      return res.status(400).json({ message: 'Invalid payment method' });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get a booking by ID
 */
const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    
    const booking = await bookingService.getBookingById(bookingId);
    
    // Check authorization (only the booking owner or driver can see it)
    const isOwnBooking = booking.user_id === req.user.id;
    const isDriver = booking.Group.Members.some(m => 
      m.user_id === req.user.id && m.role === 'driver'
    );
    
    if (!isOwnBooking && !isDriver) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }
    
    return res.status(200).json({ booking });
  } catch (error) {
    console.error('Error getting booking:', error);
    
    if (error.message === 'Booking not found') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update booking status
 */
const updateBookingStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.bookingId;
    const { status } = req.body;
    
    if (status === undefined || status === null) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const booking = await bookingService.updateBookingStatus(bookingId, userId, status);
    
    return res.status(200).json({
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    
    if (error.message === 'Booking not found') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (error.message === 'Passenger can only cancel their booking') {
      return res.status(403).json({ message: 'Passenger can only cancel their booking' });
    }
    if (error.message === 'Not authorized to update this booking') {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get all user bookings
 */
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bookings = await bookingService.getUserBookings(userId);
    
    return res.status(200).json({ bookings });
  } catch (error) {
    console.error('Error getting user bookings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get all bookings for a group (driver only)
 */
const getGroupBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.groupId;
    
    const bookings = await bookingService.getBookingsByGroupId(groupId, userId);
    
    return res.status(200).json({ bookings });
  } catch (error) {
    console.error('Error getting group bookings:', error);
    
    if (error.message === 'Not authorized to view these bookings') {
      return res.status(403).json({ message: 'Not authorized to view these bookings' });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createBooking,
  getBookingById,
  updateBookingStatus,
  getUserBookings,
  getGroupBookings
};