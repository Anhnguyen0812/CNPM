import api from './api.service';

export const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data.booking; // Extract booking from nested response
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create booking' };
  }
};

export const getBookingById = async (bookingId) => {
  try {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data.booking; // Extract booking from nested response
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch booking details' };
  }
};

export const getUserBookings = async () => {
  try {
    const response = await api.get('/bookings/user');
    return response.data.bookings; // Extract bookings array from nested response
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch user bookings' };
  }
};

export const cancelBooking = async (bookingId) => {
  try {
    const response = await api.put(`/bookings/${bookingId}/cancel`);
    return response.data; // This might be just a success message, not booking data
  } catch (error) {
    throw error.response?.data || { message: 'Failed to cancel booking' };
  }
};

export const searchRidesByActivity = async (searchData) => {
  try {
    const response = await api.post('/bookings/search/activity', searchData);
    return response.data.results; // Extract results array from nested response
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search rides by activity' };
  }
};

export const searchRidesByTrajectory = async (searchData) => {
  try {
    const response = await api.post('/bookings/search/trajectory', searchData);
    return response.data.results; // Extract results array from nested response
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search rides by trajectory' };
  }
};

export const bookRide = async (rideId, passengerData) => {
  try {
    const response = await api.post(`/bookings/ride/${rideId}`, passengerData);
    return response.data.booking;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to book the ride' };
  }
};