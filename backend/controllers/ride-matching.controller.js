const rideMatchingService = require('../services/ride-matching.service');
const activityChainService = require('../services/activity-chain.service');

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
      weightTimeFactors: req.query.weightTimeFactors === 'true',
      useTimeFlexibility: req.query.useTimeFlexibility === 'true',
      useAbraAlgorithm: req.query.useAbraAlgorithm === 'true'
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
    return res.status(500).json({ message: error.message || 'Failed to accept driver match' });
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
    return res.status(500).json({ message: 'Failed to mark chain as driver trip' });
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
    return res.status(500).json({ message: 'Failed to mark chain as passenger trip' });
  }
};

module.exports = {
  findMatchingDrivers,
  acceptDriverMatch,
  markAsDriverChain,
  markAsPassengerChain
};
