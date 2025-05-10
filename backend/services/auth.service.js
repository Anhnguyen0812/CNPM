const { User } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password.utils');
const { generateToken } = require('../utils/jwt.utils');
const { v4: uuidv4 } = require('uuid');

/**
 * Register a new user
 * @param {Object} userData - User data for registration
 * @returns {Object} New user object and token
 */
const registerUser = async (userData) => {
  try {
    // Kiểm tra người dùng với email này đã tồn tại chưa
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Kiểm tra người dùng với số điện thoại này đã tồn tại chưa nếu số điện thoại được cung cấp
    if (userData.phone) {
      const existingUserPhone = await User.findOne({ where: { phone: userData.phone } });
      if (existingUserPhone) {
        throw new Error('User with this phone number already exists');
      }
    }

    // Hash mật khẩu
    if (!userData.password) {
      throw new Error('Password is required');
    }
    
    const hashedPassword = await hashPassword(userData.password);

    // Tạo uid duy nhất cho người dùng
    const uid = uuidv4();

    // Tạo người dùng với timestamp hiện tại
    const user = await User.create({
      ...userData,
      uid,
      password: hashedPassword,
      timestamp: Date.now()
    });

    // Tạo token JWT
    const token = generateToken(user);

    // Trả về dữ liệu người dùng (không bao gồm mật khẩu) và token
    const userWithoutPassword = user.toJSON();
    delete userWithoutPassword.password;
    
    return {
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login an existing user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} User object and token
 */
const loginUser = async (email, password) => {
  try {
    // Tìm người dùng bằng email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Xác minh mật khẩu
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Tạo token JWT
    const token = generateToken(user);

    // Trả về dữ liệu người dùng (không bao gồm mật khẩu) và token
    const userWithoutPassword = user.toJSON();
    delete userWithoutPassword.password;
    
    return {
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Verify user token
 * @param {string} token - JWT token
 * @returns {Object} User object without password
 */
const verifyUserToken = async (token) => {
  try {
    const { verifyToken } = require('../utils/jwt.utils');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      throw new Error('Invalid token');
    }
    
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const userWithoutPassword = user.toJSON();
    delete userWithoutPassword.password;
    
    return userWithoutPassword;
  } catch (error) {
    console.error('Token verification error:', error);
    throw error;
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyUserToken
};