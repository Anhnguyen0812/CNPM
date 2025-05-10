const activityChainService = require('../services/activity-chain.service');
const activityService = require('../services/activity.service');
const rideMatchingService = require('../services/ride-matching.service');

/**
 * Get all activity chains for the authenticated user
 */
const getUserActivityChains = async (req, res) => {
  try {
    const userId = req.user.id;
    const activityChains = await activityChainService.getUserActivityChains(userId);
    
    return res.status(200).json({ activityChains });
  } catch (error) {
    console.error('Error getting user activity chains:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get a specific activity chain by ID
 */
const getActivityChainById = async (req, res) => {
  try {
    const userId = req.user.id;
    const chainId = req.params.chainId;
    
    const activityChain = await activityChainService.getActivityChainById(chainId, userId);
    
    return res.status(200).json({ activityChain });
  } catch (error) {
    console.error('Error getting activity chain:', error);
    if (error.message === 'Activity chain not found or not authorized') {
      return res.status(404).json({ message: 'Activity chain not found or not authorized' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new activity chain
 */
const createActivityChain = async (req, res) => {
  try {
    const userId = req.user.id;
    const chainData = req.body;
    
    const activityChain = await activityChainService.createActivityChain(userId, chainData);
    
    return res.status(201).json({
      message: 'Activity chain created successfully',
      activityChain
    });
  } catch (error) {
    console.error('Error creating activity chain:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update an activity chain
 */
const updateActivityChain = async (req, res) => {
  try {
    const userId = req.user.id;
    const chainId = req.params.chainId;
    const chainData = req.body;
    
    const activityChain = await activityChainService.updateActivityChain(chainId, userId, chainData);
    
    return res.status(200).json({
      message: 'Activity chain updated successfully',
      activityChain
    });
  } catch (error) {
    console.error('Error updating activity chain:', error);
    if (error.message === 'Activity chain not found or not authorized') {
      return res.status(404).json({ message: 'Activity chain not found or not authorized' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete an activity chain
 */
const deleteActivityChain = async (req, res) => {
  try {
    const userId = req.user.id;
    const chainId = req.params.chainId;
    
    await activityChainService.deleteActivityChain(chainId, userId);
    
    return res.status(200).json({
      message: 'Activity chain deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting activity chain:', error);
    if (error.message === 'Activity chain not found or not authorized') {
      return res.status(404).json({ message: 'Activity chain not found or not authorized' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get all activities for a specific activity chain
 */
const getActivitiesByChainId = async (req, res) => {
  try {
    const userId = req.user.id;
    const chainId = req.params.chainId;
    
    const activities = await activityService.getActivitiesByChainId(chainId, userId);
    
    return res.status(200).json({ activities });
  } catch (error) {
    console.error('Error getting activities:', error);
    if (error.message === 'Activity chain not found or not authorized') {
      return res.status(404).json({ message: 'Activity chain not found or not authorized' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new activity in an activity chain
 */
const createActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const chainId = req.params.chainId;
    const activityData = req.body;
    
    const activity = await activityService.createActivity(chainId, userId, activityData);
    
    return res.status(201).json({
      message: 'Activity created successfully',
      activity
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    if (error.message === 'Activity chain not found or not authorized') {
      return res.status(404).json({ message: 'Activity chain not found or not authorized' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Reorder activities in a chain
 */
const reorderActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const chainId = req.params.chainId;
    const { activityOrder } = req.body;
    
    if (!activityOrder || !Array.isArray(activityOrder)) {
      return res.status(400).json({ message: 'Activity order is required as an array' });
    }
    
    const activities = await activityService.reorderActivities(chainId, userId, activityOrder);
    
    return res.status(200).json({
      message: 'Activities reordered successfully',
      activities
    });
  } catch (error) {
    console.error('Error reordering activities:', error);
    if (error.message === 'Activity chain not found or not authorized') {
      return res.status(404).json({ message: 'Activity chain not found or not authorized' });
    }
    if (error.message === 'Invalid activity order') {
      return res.status(400).json({ message: 'Invalid activity order' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Mark an activity chain as a driver's trip
 */
const markAsDriverChain = async (req, res) => {
  try {
    const userId = req.user.id;
    const chainId = req.params.chainId;
    const { vehicleDetails } = req.body;
    
    const result = await activityChainService.markAsDriverChain(chainId, userId, vehicleDetails);
    
    return res.status(200).json({
      message: 'Activity chain marked as driver trip',
      data: result
    });
  } catch (error) {
    console.error('Error marking as driver chain:', error);
    if (error.message === 'Activity chain not found or not authorized') {
      return res.status(404).json({ message: 'Activity chain not found or not authorized' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Mark an activity chain as a passenger's trip
 */
const markAsPassengerChain = async (req, res) => {
  try {
    const userId = req.user.id;
    const chainId = req.params.chainId;
    const { preferences } = req.body;
    
    const result = await activityChainService.markAsPassengerChain(chainId, userId, preferences);
    
    return res.status(200).json({
      message: 'Activity chain marked as passenger trip',
      data: result
    });
  } catch (error) {
    console.error('Error marking as passenger chain:', error);
    if (error.message === 'Activity chain not found or not authorized') {
      return res.status(404).json({ message: 'Activity chain not found or not authorized' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Find matching drivers for a passenger's activity chain
 */
const findMatchingDrivers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chainId, timeWindow = 15, maxDistance = 2000 } = req.query;
    
    // Lấy các tham số nâng cao từ query params
    const advancedOptions = {
      prioritizeTimeMatching: req.query.prioritizeTimeMatching === 'true',
      enhancedMatching: req.query.enhancedMatching === 'true',
      considerTraffic: req.query.considerTraffic === 'true',
      maxDetourPercent: parseInt(req.query.maxDetourPercent || '25', 10),
      weightTimeFactors: req.query.weightTimeFactors === 'true'
    };
    
    console.log(`Finding matching drivers for chain ${chainId} with options:`, advancedOptions);
    
    if (!chainId) {
      return res.status(400).json({ message: 'Activity chain ID is required' });
    }
    
    const matches = await rideMatchingService.findMatchingDrivers(
      chainId, 
      userId, 
      parseInt(timeWindow, 10), 
      parseInt(maxDistance, 10), 
      advancedOptions
    );
    
    return res.status(200).json({
      message: 'Matching drivers found',
      matches
    });
  } catch (error) {
    console.error('Error finding matching drivers:', error);
    
    if (error.message === 'Activity chain not found or not authorized') {
      return res.status(404).json({ message: 'Activity chain not found or not marked as passenger. Please select a valid chain.' });
    }
    
    return res.status(500).json({ message: error.message || 'Failed to find matching drivers' });
  }
};

/**
 * Accept a driver match for a passenger's activity chain
 */
const acceptDriverMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { passengerChainId, driverChainId } = req.body;
    
    if (!passengerChainId || !driverChainId) {
      return res.status(400).json({ message: 'Passenger chain ID and driver chain ID are required' });
    }
    
    const result = await rideMatchingService.acceptDriverMatch(
      passengerChainId,
      driverChainId,
      userId
    );
    
    return res.status(200).json({
      message: 'Driver match accepted successfully',
      data: result
    });
  } catch (error) {
    console.error('Error accepting driver match:', error);
    if (error.message === 'Activity chain not found or not authorized') {
      return res.status(404).json({ message: 'Activity chain not found or not authorized' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getUserActivityChains,
  getActivityChainById,
  createActivityChain,
  updateActivityChain,
  deleteActivityChain,
  getActivitiesByChainId,
  createActivity,
  reorderActivities,
  markAsDriverChain,
  markAsPassengerChain,
  findMatchingDrivers,
  acceptDriverMatch
};