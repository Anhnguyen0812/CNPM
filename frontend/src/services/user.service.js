import api from './api.service';

export const getUserProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    return response.data; // The backend now returns the user object directly
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error.response?.data || { message: 'Failed to fetch user profile' };
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const response = await api.put('/users/profile', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update user profile' };
  }
};

export const getUserVehicles = async () => {
  try {
    const response = await api.get('/users/vehicles');
    return response.data.vehicles; // Extract vehicles from the nested response
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch user vehicles' };
  }
};

export const addVehicle = async (vehicleData) => {
  try {
    const response = await api.post('/vehicles', vehicleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to add vehicle' };
  }
};

export const updateVehicle = async (vehicleId, vehicleData) => {
  try {
    const response = await api.put(`/vehicles/${vehicleId}`, vehicleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update vehicle' };
  }
};

export const deleteVehicle = async (vehicleId) => {
  try {
    const response = await api.delete(`/vehicles/${vehicleId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete vehicle' };
  }
};

/**
 * Check if user is a driver (has registered vehicles)
 * @returns {Promise<boolean>} True if user is a driver
 */
export const checkIsDriver = async () => {
  try {
    const response = await api.get('/vehicles/me/is-driver');
    return response.data.isDriver;
  } catch (error) {
    console.error('Error checking if user is driver:', error);
    return false;
  }
};