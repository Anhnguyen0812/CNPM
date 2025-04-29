const express = require('express');
const router = express.Router();
const { register, login, getProfile, checkAuth } = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.get('/check', verifyToken, checkAuth);

module.exports = router;