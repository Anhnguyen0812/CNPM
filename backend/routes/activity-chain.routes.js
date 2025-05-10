const express = require('express');
const activityChainController = require('../controllers/activity-chain.controller');
const activityController = require('../controllers/activity.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes in this file require authentication
router.use(authenticate);

// Activity chain routes
router.get('/me/activity-chains', activityChainController.getUserActivityChains);
router.post('/me/activity-chains', activityChainController.createActivityChain);
router.get('/me/activity-chains/:chainId', activityChainController.getActivityChainById);
router.put('/me/activity-chains/:chainId', activityChainController.updateActivityChain);
router.delete('/me/activity-chains/:chainId', activityChainController.deleteActivityChain);

// Activity routes within a chain
router.get('/me/activity-chains/:chainId/activities', activityChainController.getActivitiesByChainId);
router.post('/me/activity-chains/:chainId/activities', activityChainController.createActivity);
router.post('/me/activity-chains/:chainId/activities/reorder', activityChainController.reorderActivities);

// Individual activity routes
router.get('/me/activities/:activityId', activityController.getActivityById);
router.put('/me/activities/:activityId', activityController.updateActivity);
router.delete('/me/activities/:activityId', activityController.deleteActivity);

// Ride-sharing routes
router.post('/me/activity-chains/:chainId/driver', activityChainController.markAsDriverChain);
router.post('/me/activity-chains/:chainId/passenger', activityChainController.markAsPassengerChain);
router.get('/me/passenger/matches', activityChainController.findMatchingDrivers);
router.post('/me/passenger/accept-match', activityChainController.acceptDriverMatch);

module.exports = router;