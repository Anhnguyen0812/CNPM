const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');

// // Tạm thời, chúng ta chỉ tạo các route giả để tránh lỗi
// router.get('/', verifyToken, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Payment methods fetched',
//     data: []
//   });
// });

// router.post('/', verifyToken, (req, res) => {
//   res.status(201).json({
//     success: true,
//     message: 'Payment method added successfully',
//     data: { id: 1, ...req.body }
//   });
// });

// router.put('/:id', verifyToken, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Payment method updated successfully',
//     data: { id: req.params.id, ...req.body }
//   });
// });

// router.delete('/:id', verifyToken, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Payment method deleted successfully'
//   });
// });

// router.post('/process', verifyToken, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Payment processed successfully',
//     data: { id: 1, status: 'completed', ...req.body }
//   });
// });

module.exports = router;