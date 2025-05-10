const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object to include in the token payload
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  return token;
};

/**
 * Verify a JWT token and return the decoded payload
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};