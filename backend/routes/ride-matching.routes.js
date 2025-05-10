const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const rideMatchingController = require('../controllers/ride-matching.controller');

// Áp dụng middleware xác thực cho tất cả các routes
router.use(authenticate);

// Route để tìm kiếm tài xế phù hợp
router.get('/passenger/matches', rideMatchingController.findMatchingDrivers);

// Route để chấp nhận một tài xế phù hợp
router.post('/passenger/accept-match', rideMatchingController.acceptDriverMatch);

// Route để đánh dấu một chuỗi hoạt động là chuỗi của tài xế
router.post('/chains/:chainId/driver', rideMatchingController.markAsDriverChain);

// Route để đánh dấu một chuỗi hoạt động là chuỗi của hành khách
router.post('/chains/:chainId/passenger', rideMatchingController.markAsPassengerChain);

module.exports = router;
