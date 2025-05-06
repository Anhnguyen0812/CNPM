const express = require('express');
const router = express.Router();
const { verifyToken, isDriver, isCustomer } = require('../middlewares/auth.middleware');
const trajectoryController = require('../controllers/trajectory.controller');

// User trajectories routes
router.get('/trajectories', verifyToken, trajectoryController.getUserTrajectories);
router.post('/trajectories', verifyToken, trajectoryController.createTrajectory);
router.delete('/trajectories/:trajectoryId', verifyToken, trajectoryController.deleteTrajectory);

// Trajectory similarity calculation
router.get('/similarity', verifyToken, trajectoryController.calculateTrajectorySimilarity);

// Profile compatibility calculation
router.get('/compatibility', verifyToken, trajectoryController.calculateProfileCompatibility);

// Trajectory-based matching routes
router.get('/matches', verifyToken, trajectoryController.findTrajectoryMatches);

// // Trajectory-based ride creation
// router.post('/rides', verifyToken, trajectoryController.createTrajectoryBasedRide);

// Get trajectory ride match details
router.get('/rides/:rideId/details', verifyToken, trajectoryController.getTrajectoryMatchDetails);

module.exports = router;