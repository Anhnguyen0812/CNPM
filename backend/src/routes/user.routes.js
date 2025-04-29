const express = require('express');
const router = express.Router();
const {verifyToken} = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

// Get user profile
router.get('/profile', verifyToken, userController.getProfile);

// // Update user profile - sửa từ updateProfile sang update
// router.put('/:id', verifyToken, userController.update);

// // Get all users (admin only)
router.get('/', verifyToken, userController.getAllUsers);

// // Get user by ID
// router.get('/:id', verifyToken, userController.getUserById);

// // Delete user (admin or own account)
// router.delete('/:id', verifyToken, userController.deleteUser);

module.exports = router;