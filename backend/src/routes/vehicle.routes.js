const express = require('express');
const router = express.Router();
const { verifyToken, isDriver } = require('../middlewares/auth.middleware');

// // Tạm thời, chúng ta chỉ tạo các route giả để tránh lỗi
// router.get('/', verifyToken, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Vehicle routes working',
//     data: []
//   });
// });

// router.post('/', verifyToken, isDriver, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Vehicle added successfully',
//     data: { id: 1, ...req.body }
//   });
// });

// router.get('/:id', verifyToken, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Vehicle details',
//     data: { id: req.params.id, make: 'Toyota', model: 'Camry', year: 2022 }
//   });
// });

// router.put('/:id', verifyToken, isDriver, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Vehicle updated successfully',
//     data: { id: req.params.id, ...req.body }
//   });
// });

// router.delete('/:id', verifyToken, isDriver, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Vehicle deleted successfully'
//   });
// });

module.exports = router;