const { Vehicle } = require('../models');

/**
 * Get all vehicles for a user
 * @param {number} userId - User ID to get vehicles for
 * @returns {Array} List of user's vehicles
 */
const getUserVehicles = async (userId) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { user_id: userId }
    });
    
    return vehicles;
  } catch (error) {
    throw error;
  }
};

/**
 * Get vehicle by ID
 * @param {number} vehicleId - Vehicle ID to find
 * @param {number} userId - User ID (for authorization)
 * @returns {Object} Vehicle object
 */
const getVehicleById = async (vehicleId, userId) => {
  try {
    const vehicle = await Vehicle.findOne({
      where: { 
        id: vehicleId,
        user_id: userId
      }
    });
    
    if (!vehicle) {
      throw new Error('Vehicle not found or not authorized');
    }
    
    return vehicle;
  } catch (error) {
    throw error;
  }
};

/**
 * Map frontend data to backend fields
 * @param {Object} data - Frontend data
 * @returns {Object} Mapped backend data
 */
const mapFrontendToBackend = (data) => ({
  vehicle_name: data.make + (data.model ? ' ' + data.model : ''),
  vehicle_number: data.licensePlate || data.vehicle_number,
  vehicle_color: data.color || data.vehicle_color,
  vehicle_type: data.type || data.vehicle_type || null,
  capacity: data.capacity || null,
  year: data.year || null,
  vehicle_image: data.vehicle_image || null
});

/**
 * Create a new vehicle for a user
 * @param {number} userId - User ID to create vehicle for
 * @param {Object} vehicleData - Vehicle data to create
 * @returns {Object} Created vehicle object
 */
const createVehicle = async (userId, vehicleData) => {
  try {
    // Check if vehicle number already exists
    if (vehicleData.licensePlate || vehicleData.vehicle_number) {
      const existingVehicle = await Vehicle.findOne({
        where: { vehicle_number: vehicleData.licensePlate || vehicleData.vehicle_number }
      });
      
      if (existingVehicle) {
        throw new Error('Vehicle with this number already exists');
      }
    }
    
    // Map fields from frontend to backend
    const mappedData = mapFrontendToBackend(vehicleData);
    
    // Create vehicle with current timestamp
    const vehicle = await Vehicle.create({
      ...mappedData,
      user_id: userId,
      timestamp: Date.now()
    });
    
    return vehicle;
  } catch (error) {
    throw error;
  }
};

/**
 * Update a vehicle
 * @param {number} vehicleId - Vehicle ID to update
 * @param {number} userId - User ID (for authorization)
 * @param {Object} vehicleData - Vehicle data to update
 * @returns {Object} Updated vehicle object
 */
const updateVehicle = async (vehicleId, userId, vehicleData) => {
  try {
    const vehicle = await Vehicle.findOne({
      where: { 
        id: vehicleId,
        user_id: userId
      }
    });
    
    if (!vehicle) {
      throw new Error('Vehicle not found or not authorized');
    }
    
    // Check if vehicle number is being changed and already exists
    if ((vehicleData.licensePlate || vehicleData.vehicle_number) && (vehicleData.licensePlate || vehicleData.vehicle_number) !== vehicle.vehicle_number) {
      const existingVehicle = await Vehicle.findOne({
        where: { vehicle_number: vehicleData.licensePlate || vehicleData.vehicle_number }
      });
      
      if (existingVehicle) {
        throw new Error('Vehicle with this number already exists');
      }
    }
    
    // Map fields from frontend to backend
    const mappedData = mapFrontendToBackend(vehicleData);
    
    // Update vehicle
    await vehicle.update(mappedData);
    
    return vehicle;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a vehicle
 * @param {number} vehicleId - Vehicle ID to delete
 * @param {number} userId - User ID (for authorization)
 * @returns {boolean} True if deleted successfully
 */
const deleteVehicle = async (vehicleId, userId) => {
  try {
    const vehicle = await Vehicle.findOne({
      where: { 
        id: vehicleId,
        user_id: userId
      }
    });
    
    if (!vehicle) {
      throw new Error('Vehicle not found or not authorized');
    }
    
    await vehicle.destroy();
    
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if a user owns any vehicles (if they can be a driver)
 * @param {number} userId - User ID to check
 * @returns {boolean} True if user has at least one vehicle
 */
const isUserDriver = async (userId) => {
  try {
    const count = await Vehicle.count({
      where: { user_id: userId }
    });
    
    return count > 0;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getUserVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  isUserDriver
};