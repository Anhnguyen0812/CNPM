const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// Tất cả các routes trong này đều yêu cầu xác thực
router.use(authenticate);

// Lấy thông tin người dùng hiện tại
router.get('/profile', userController.getUserProfile);

// Cập nhật thông tin người dùng
router.put('/profile', userController.updateUserProfile);

// Lấy danh sách phương tiện của người dùng
router.get('/vehicles', userController.getUserVehicles);

module.exports = router;