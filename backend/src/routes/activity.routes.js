const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// // Tạm thời, chúng ta chỉ tạo các route giả để tránh lỗi
// router.get('/', verifyToken, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'User activities fetched',
//     data: []
//   });
// });

// router.get('/admin', verifyToken, isAdmin, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'All user activities fetched',
//     data: []
//   });
// });

module.exports = router;