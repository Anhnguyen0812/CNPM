const express = require('express');
const vehicleController = require('../controllers/vehicle.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes in this file require authentication
router.use(authenticate);

// Vehicle routes
router.get('/me/is-driver', vehicleController.checkUserIsDriver);
router.get('/me/vehicles', vehicleController.getUserVehicles);
router.post('/me/vehicles', vehicleController.createVehicle);
router.get('/me/vehicles/:vehicleId', vehicleController.getVehicleById);
router.put('/me/vehicles/:vehicleId', vehicleController.updateVehicle);
router.delete('/me/vehicles/:vehicleId', vehicleController.deleteVehicle);

module.exports = router;