const express = require('express');
const router = express.Router();
const { verifyToken, isCustomer, isDriver } = require('../middlewares/auth.middleware');

// // Tạm thời, chúng ta chỉ tạo các route giả để tránh lỗi
// router.post('/book', verifyToken, isCustomer, (req, res) => {
//   res.status(201).json({
//     success: true,
//     message: 'Ride booked successfully',
//     data: { id: 1, status: 'pending', ...req.body }
//   });
// });

// router.get('/active', verifyToken, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Active ride fetched',
//     data: null // Hoặc dữ liệu giả nếu muốn
//   });
// });

// router.get('/history', verifyToken, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Ride history fetched',
//     data: []
//   });
// });

// router.get('/:id', verifyToken, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Ride details fetched',
//     data: { id: req.params.id, status: 'completed' }
//   });
// });

// router.put('/:id/accept', verifyToken, isDriver, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Ride accepted successfully',
//     data: { id: req.params.id, status: 'accepted' }
//   });
// });

// router.put('/:id/cancel', verifyToken, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Ride cancelled successfully',
//     data: { id: req.params.id, status: 'cancelled' }
//   });
// });

// router.put('/:id/complete', verifyToken, isDriver, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Ride completed successfully',
//     data: { id: req.params.id, status: 'completed' }
//   });
// });

module.exports = router;