const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];
  
  if (!process.env.JWT_SECRET) {
    console.error('WARNING: JWT_SECRET environment variable is not set!');
    return res.status(500).json({ 
      success: false, 
      message: 'Server configuration error.' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Middleware to check if user is a driver
const isDriver = (req, res, next) => {
  if (req.user && req.user.role === 'driver') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Driver role required.'
    });
  }
};

// Middleware to check if user is a customer
const isCustomer = (req, res, next) => {
  if (req.user && req.user.role === 'customer') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Customer role required.'
    });
  }
};

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin role required.'
    });
  }
};

// Middleware to check if user is the owner of the resource
const isResourceOwner = (req, res, next) => {
  const resourceUserId = parseInt(req.params.userId || req.body.userId);
  const requestingUserId = req.user.id;

  if (requestingUserId === resourceUserId || req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. You do not have permission to access this resource.'
    });
  }
};

module.exports = {
  verifyToken,
  isDriver,
  isCustomer,
  isAdmin,
  isResourceOwner
};