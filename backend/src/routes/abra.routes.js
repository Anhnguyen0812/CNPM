const express = require('express');
const router = express.Router();
const { verifyToken, isDriver, isCustomer } = require('../middlewares/auth.middleware');
const abraController = require('../controllers/abra.controller');

// User schedule routes
router.get('/schedules', verifyToken, abraController.getUserSchedules);
router.post('/schedules', verifyToken, abraController.createSchedule);

// Activities routes
router.get('/schedules/:scheduleId/activities', verifyToken, abraController.getScheduleActivities);
router.post('/activities', verifyToken, abraController.createActivity);
router.delete('/activities/:activityId', verifyToken, abraController.deleteActivity);

// Trip chains routes
router.get('/trip-chains', verifyToken, abraController.generateTripChains);

// Alternative locations routes
router.get('/activities/:activityId/alternative-locations', verifyToken, abraController.findAlternativeLocations);

// Activity-based matching routes
router.get('/matches', verifyToken, abraController.findActivityBasedMatches);

// Activity-based ride creation
router.post('/rides', verifyToken, abraController.createABRARide);

// // Get ABRA ride match details
router.get('/rides/:rideId/matches', verifyToken, abraController.getABRARideMatches);

module.exports = router;