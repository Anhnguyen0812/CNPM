const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Xác minh token
router.post('/verify-token', authController.verifyToken);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;