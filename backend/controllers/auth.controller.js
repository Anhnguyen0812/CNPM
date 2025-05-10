const authService = require('../services/auth.service');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const register = async (req, res) => {
  try {
    const userData = req.body;
    
    // Kiểm tra các trường bắt buộc
    if (!userData.name || !userData.email || !userData.password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    
    // Xác thực định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Xác thực mật khẩu
    if (userData.password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    const result = await authService.registerUser(userData);
    
    return res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Login an existing user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Kiểm tra các trường bắt buộc
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const result = await authService.loginUser(email, password);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Login error:', error);
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Verify user token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    const user = await authService.verifyUserToken(token);
    
    return res.status(200).json({ user, valid: true });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Invalid token', valid: false });
  }
};

/**
 * Get current authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCurrentUser = async (req, res) => {
  try {
    // req.user đã được đặt bởi middleware authenticate
    return res.status(200).json({ user: req.user });
  } catch (error) {
    console.error('Error getting current user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  verifyToken,
  getCurrentUser
};