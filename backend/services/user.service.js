const { User } = require('../models');
const { hashPassword } = require('../utils/password.utils');

/**
 * Get user by ID
 * @param {number} userId - User ID to find
 * @returns {Object} User object or null if not found
 */
const getUserById = async (userId) => {
  try {
    // Truy vấn người dùng với tất cả các trường
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Chuyển đổi dữ liệu người dùng và loại bỏ password
    const userData = user.toJSON();
    delete userData.password;
    
    return userData;
  } catch (error) {
    console.error('Error in getUserById:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {number} userId - User ID to update
 * @param {Object} userData - User data to update
 * @returns {Object} Updated user object
 */
const updateUser = async (userId, userData) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Xử lý cập nhật mật khẩu riêng biệt nếu được cung cấp
    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    } else {
      // Không cập nhật mật khẩu nếu không được cung cấp
      delete userData.password;
    }
    
    // Ngăn chặn cập nhật các trường nhạy cảm
    delete userData.uid;
    
    // Cập nhật người dùng
    await user.update(userData);
    
    // Trả về dữ liệu người dùng đã cập nhật mà không có mật khẩu
    const updatedUserData = user.toJSON();
    delete updatedUserData.password;
    
    return updatedUserData;
  } catch (error) {
    console.error('Error in updateUser:', error);
    throw error;
  }
};

module.exports = {
  getUserById,
  updateUser
};