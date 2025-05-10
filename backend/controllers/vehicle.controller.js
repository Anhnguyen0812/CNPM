const vehicleService = require('../services/vehicle.service');

/**
 * Get all vehicles for the authenticated user
 */
const getUserVehicles = async (req, res) => {
  try {
    const userId = req.user.id;
    const vehicles = await vehicleService.getUserVehicles(userId);
    
    return res.status(200).json({ vehicles });
  } catch (error) {
    console.error('Error getting user vehicles:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get a specific vehicle by ID for the authenticated user
 */
const getVehicleById = async (req, res) => {
  try {
    const userId = req.user.id;
    const vehicleId = req.params.vehicleId;
    
    const vehicle = await vehicleService.getVehicleById(vehicleId, userId);
    
    return res.status(200).json({ vehicle });
  } catch (error) {
    console.error('Error getting vehicle:', error);
    if (error.message === 'Vehicle not found or not authorized') {
      return res.status(404).json({ message: 'Vehicle not found or not authorized' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new vehicle for the authenticated user
 */
const createVehicle = async (req, res) => {
  try {
    const userId = req.user.id;
    const vehicleData = req.body;
    
    const vehicle = await vehicleService.createVehicle(userId, vehicleData);
    
    return res.status(201).json({
      message: 'Vehicle created successfully',
      vehicle
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    if (error.message === 'Vehicle with this number already exists') {
      return res.status(409).json({ message: 'Vehicle with this number already exists' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update a vehicle for the authenticated user
 */
const updateVehicle = async (req, res) => {
  try {
    const userId = req.user.id;
    const vehicleId = req.params.vehicleId;
    const vehicleData = req.body;
    
    const vehicle = await vehicleService.updateVehicle(vehicleId, userId, vehicleData);
    
    return res.status(200).json({
      message: 'Vehicle updated successfully',
      vehicle
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    if (error.message === 'Vehicle not found or not authorized') {
      return res.status(404).json({ message: 'Vehicle not found or not authorized' });
    }
    if (error.message === 'Vehicle with this number already exists') {
      return res.status(409).json({ message: 'Vehicle with this number already exists' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a vehicle for the authenticated user
 */
const deleteVehicle = async (req, res) => {
  try {
    const userId = req.user.id;
    const vehicleId = req.params.vehicleId;
    
    await vehicleService.deleteVehicle(vehicleId, userId);
    
    return res.status(200).json({
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    if (error.message === 'Vehicle not found or not authorized') {
      return res.status(404).json({ message: 'Vehicle not found or not authorized' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Check if the authenticated user is a driver (has any vehicles)
 */
const checkUserIsDriver = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const isDriver = await vehicleService.isUserDriver(userId);
    
    return res.status(200).json({ isDriver });
  } catch (error) {
    console.error('Error checking if user is driver:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getUserVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  checkUserIsDriver
};