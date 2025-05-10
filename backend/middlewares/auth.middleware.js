const { verifyToken } = require('../utils/jwt.utils');
const { User } = require('../models');

/**
 * Middleware to authenticate user using JWT token
 * This middleware verifies the token and attaches the user to the request object
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = async (req, res, next) => {
  try {
    // Lấy token từ header request
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. Please provide a valid token.' });
    }
    
    // Trích xuất token từ header
    const token = authHeader.split(' ')[1];
    
    // Xác minh token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Tìm người dùng với tất cả các trường
    const user = await User.findOne({ 
      where: { id: decoded.id }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Loại bỏ password trước khi gắn vào request
    const userData = user.toJSON();
    delete userData.password;
    
    // Gắn thông tin người dùng vào request object
    req.user = userData;
    
    // Tiếp tục đến middleware hoặc controller tiếp theo
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed. Please log in again.' });
  }
};

/**
 * Middleware to check if user is a driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const isDriver = async (req, res, next) => {
  try {
    // Sử dụng req.user từ middleware authenticate
    const userId = req.user.id;
    
    // Tìm thành viên với vai trò là driver
    const { Member } = require('../models');
    const driverMember = await Member.findOne({
      where: {
        user_id: userId,
        role: 'driver'
      }
    });
    
    if (!driverMember) {
      return res.status(403).json({ message: 'Access denied. Driver role required.' });
    }
    
    // Tiếp tục đến middleware hoặc controller tiếp theo
    next();
  } catch (error) {
    console.error('Error checking driver role:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  authenticate,
  isDriver
};