const groupService = require('../services/group.service');

/**
 * Create a new ride group (offer a ride)
 */
const createGroup = async (req, res) => {
  try {
    const driverUserId = req.user.id;
    const groupData = req.body;
    
    const group = await groupService.createGroup(groupData, driverUserId);
    
    return res.status(201).json({
      message: 'Ride offered successfully',
      group
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get a specific group by ID
 */
const getGroupById = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    const group = await groupService.getGroupById(groupId);
    
    return res.status(200).json({ group });
  } catch (error) {
    console.error('Error getting group:', error);
    if (error.message === 'Group not found') {
      return res.status(404).json({ message: 'Group not found' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update a group
 */
const updateGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.groupId;
    const groupData = req.body;
    
    const group = await groupService.updateGroup(groupId, userId, groupData);
    
    return res.status(200).json({
      message: 'Group updated successfully',
      group
    });
  } catch (error) {
    console.error('Error updating group:', error);
    if (error.message === 'Group not found') {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (error.message === 'Not authorized to update this group') {
      return res.status(403).json({ message: 'Not authorized to update this group' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a group
 */
const deleteGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.groupId;
    
    await groupService.deleteGroup(groupId, userId);
    
    return res.status(200).json({
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    if (error.message === 'Not authorized to delete this group') {
      return res.status(403).json({ message: 'Not authorized to delete this group' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Search for groups by activity
 */
const searchGroupsByActivity = async (req, res) => {
  try {
    const userActivityChainData = req.body;
    
    if (!userActivityChainData.activities || !Array.isArray(userActivityChainData.activities) || userActivityChainData.activities.length === 0) {
      return res.status(400).json({ message: 'Valid activities are required' });
    }
    
    const groups = await groupService.findGroupsByActivity(userActivityChainData, userActivityChainData.searchParams || {});
    
    return res.status(200).json({ groups });
  } catch (error) {
    console.error('Error searching groups by activity:', error);
    if (error.message === 'Invalid activity chain data') {
      return res.status(400).json({ message: 'Invalid activity chain data' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Search for groups by trajectory
 */
const searchGroupsByTrajectory = async (req, res) => {
  try {
    const searchCriteria = req.body;
    
    // Validate required fields
    if (!searchCriteria.startLat || !searchCriteria.startLon || 
        !searchCriteria.endLat || !searchCriteria.endLon || 
        !searchCriteria.startTime) {
      return res.status(400).json({ message: 'Start and end coordinates and start time are required' });
    }
    
    const groups = await groupService.findGroupsByTrajectory(searchCriteria);
    
    return res.status(200).json({ groups });
  } catch (error) {
    console.error('Error searching groups by trajectory:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get all groups where the user is a member
 */
const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const groups = await groupService.getUserGroups(userId);
    
    return res.status(200).json({ groups });
  } catch (error) {
    console.error('Error getting user groups:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get user's current active group (if any)
 */
const getUserActiveGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const activeGroup = await groupService.getUserActiveGroup(userId);
    
    if (!activeGroup) {
      return res.status(404).json({ message: 'No active group found' });
    }
    
    return res.status(200).json({ group: activeGroup });
  } catch (error) {
    console.error('Error getting active group:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a group from a driver's activity chain
 */
const createGroupFromChain = async (req, res) => {
  try {
    const driverUserId = req.user.id;
    const { chainId, limitPassenger, vehicleDetails } = req.body;
    
    if (!chainId) {
      return res.status(400).json({ message: 'Activity chain ID is required' });
    }
    
    const group = await groupService.createGroupFromActivityChain(
      chainId, 
      driverUserId, 
      limitPassenger || 4,
      vehicleDetails || {}
    );
    
    return res.status(201).json({
      message: 'Group created successfully from activity chain',
      group
    });
  } catch (error) {
    console.error('Error creating group from activity chain:', error);
    if (error.message === 'Activity chain not found or not authorized') {
      return res.status(404).json({ message: 'Activity chain not found or not authorized' });
    }
    if (error.message === 'Activity chain is not marked as driver') {
      return res.status(400).json({ message: 'Activity chain must be marked as driver first' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Find potential passenger matches for a driver's group based on activity chain
 */
const findPassengerMatches = async (req, res) => {
  try {
    const driverUserId = req.user.id;
    const { chainId, groupId } = req.query;
    
    if (!chainId || !groupId) {
      return res.status(400).json({ message: 'Activity chain ID and group ID are required' });
    }
    
    const matches = await groupService.findPotentialPassengerMatches(
      chainId,
      groupId,
      driverUserId
    );
    
    return res.status(200).json({
      message: 'Potential passenger matches found',
      matches
    });
  } catch (error) {
    console.error('Error finding passenger matches:', error);
    if (error.message === 'Group not found or not authorized') {
      return res.status(404).json({ message: 'Group not found or not authorized' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createGroup,
  getGroupById,
  updateGroup,
  deleteGroup,
  searchGroupsByActivity,
  searchGroupsByTrajectory,
  getUserGroups,
  getUserActiveGroup,
  createGroupFromChain,
  findPassengerMatches
};