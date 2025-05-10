const userService = require('../services/user.service');

/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Getting profile for user ID:', userId);
    
    const user = await userService.getUserById(userId);
    console.log('User profile retrieved successfully');
    
    // Trả về đối tượng người dùng trực tiếp
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user profile:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userData = req.body;
    
    // Kiểm tra và xác thực dữ liệu đầu vào
    if (userData.email) {
      return res.status(400).json({ message: 'Email cannot be updated' });
    }
    
    const updatedUser = await userService.updateUser(userId, userData);
    
    return res.status(200).json({
      message: 'User profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get current user's vehicles
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserVehicles = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Import vehicle service
    const vehicleService = require('../services/vehicle.service');
    // Sửa tên hàm từ getVehiclesByUserId thành getUserVehicles
    const vehicles = await vehicleService.getUserVehicles(userId);
    
    return res.status(200).json({
      vehicles
    });
  } catch (error) {
    console.error('Error getting user vehicles:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserVehicles
};