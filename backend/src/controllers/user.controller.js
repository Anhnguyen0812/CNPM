const User = require('../models/user.model');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userProfile = await User.getProfile(userId);
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is updating their own profile or is an admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }
    
    // Split the data between user table and profile table
    const { name, email, phone, profilePicture, ...profileData } = req.body;
    
    // Update basic user information
    const userData = { name, email, phone, profile_picture: profilePicture };
    const updatedUser = await User.update(userId, userData);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user profile information if profile data exists
    if (Object.keys(profileData).length > 0) {
      await User.updateProfile(userId, profileData);
    }
    
    // Get the complete updated profile
    const updatedProfile = await User.getProfile(userId);
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: error.message
    });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    // Check if the requester is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    const { page, limit, role, searchTerm } = req.query;
    const usersData = await User.findAll({ page, limit, role, searchTerm });
    
    res.status(200).json({
      success: true,
      data: usersData.users,
      pagination: usersData.pagination
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is requesting their own profile or is an admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is deleting their own account or is an admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this user'
      });
    }
    
    const success = await User.delete(userId);
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  deleteUser
};