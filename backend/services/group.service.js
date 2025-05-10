const { Group, Member, User, Vehicle, ActivityChain, Activity, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new ride group (offer ride)
 * @param {Object} groupData - Group data
 * @param {number} driverUserId - User ID of the driver
 * @returns {Object} Created group with driver member
 */
const createGroup = async (groupData, driverUserId) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Create group with current timestamp
    const group = await Group.create({
      ...groupData,
      timestamp: Date.now()
    }, { transaction });
    
    // Create member entry for the driver
    const memberUid = uuidv4();
    await Member.create({
      uid: memberUid,
      user_id: driverUserId,
      group_id: group.id,
      role: 'driver',
      join_timestamp: Date.now()
    }, { transaction });
    
    await transaction.commit();
    
    // Return the created group with its members
    return await getGroupById(group.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Get group by ID with members
 * @param {number} groupId - Group ID
 * @returns {Object} Group with members
 */
const getGroupById = async (groupId) => {
  try {
    const group = await Group.findByPk(groupId, {
      include: [
        {
          model: Member,
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'url', 'email', 'phone']
            }
          ]
        }
      ]
    });
    
    if (!group) {
      throw new Error('Group not found');
    }
    
    return group;
  } catch (error) {
    throw error;
  }
};

/**
 * Update a group
 * @param {number} groupId - Group ID
 * @param {number} userId - User ID (must be the driver)
 * @param {Object} groupData - Group data to update
 * @returns {Object} Updated group
 */
const updateGroup = async (groupId, userId, groupData) => {
  try {
    // Check if user is the driver of this group
    const membership = await Member.findOne({
      where: {
        group_id: groupId,
        user_id: userId,
        role: 'driver'
      }
    });
    
    if (!membership) {
      throw new Error('Not authorized to update this group');
    }
    
    // Get the group
    const group = await Group.findByPk(groupId);
    
    if (!group) {
      throw new Error('Group not found');
    }
    
    // Update the group
    await group.update(groupData);
    
    // Return the updated group with members
    return await getGroupById(groupId);
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a group
 * @param {number} groupId - Group ID
 * @param {number} userId - User ID (must be the driver)
 * @returns {boolean} True if deleted successfully
 */
const deleteGroup = async (groupId, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Check if user is the driver of this group
    const membership = await Member.findOne({
      where: {
        group_id: groupId,
        user_id: userId,
        role: 'driver'
      }
    }, { transaction });
    
    if (!membership) {
      await transaction.rollback();
      throw new Error('Not authorized to delete this group');
    }
    
    // Delete all members in this group
    await Member.destroy({
      where: { group_id: groupId },
      transaction
    });
    
    // Delete the group
    await Group.destroy({
      where: { id: groupId },
      transaction
    });
    
    await transaction.commit();
    
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Find groups by activity (ABRA algorithm simulation)
 * @param {Object} userActivityChainData - User's activity chain data
 * @param {Object} searchParams - Additional search parameters
 * @returns {Array} List of matching groups
 */
const findGroupsByActivity = async (userActivityChainData, searchParams) => {
  try {
    // Extract relevant data from the user's activity chain
    const { activities, startTime, endTime, maxDetourDistance, maxDetourTime } = userActivityChainData;
    
    // Here we would implement the ABRA (Activity-Based Ride-sharing Algorithm)
    // This is a simplified version that searches for groups with matching routes
    // In a real application, this would be a complex algorithm considering time,
    // space, and other constraints
    
    // For this demo, we'll just search for groups that have matching start and end locations
    // within the specified time window
    const startLocation = activities[0]?.start_place;
    const endLocation = activities[activities.length - 1]?.end_place;
    
    if (!startLocation || !endLocation) {
      throw new Error('Invalid activity chain data');
    }
    
    // Search for groups with matching start and end locations
    const matchingGroups = await Group.findAll({
      where: {
        status: 0, // Open groups only
        start_timestamp: {
          [sequelize.Op.between]: [startTime - maxDetourTime, startTime + maxDetourTime]
        }
      },
      include: [
        {
          model: Member,
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'url', 'email', 'phone']
            }
          ]
        }
      ]
    });
    
    // Filter groups by location proximity - this is simplified
    // In a real app, you would use geospatial queries or calculate distances properly
    const filteredGroups = matchingGroups.filter(group => {
      // Check if start and end locations are within maxDetourDistance
      // This is a simplified check that could be improved with actual geocoding and routing
      const startNameMatch = group.origin_name && 
        group.origin_name.toLowerCase().includes(startLocation.toLowerCase());
      
      const endNameMatch = group.destination_name && 
        group.destination_name.toLowerCase().includes(endLocation.toLowerCase());
      
      return startNameMatch && endNameMatch;
    });
    
    // Additional filtering based on available seats, etc.
    return filteredGroups.filter(group => {
      const memberCount = group.Members.length;
      return memberCount < group.limit_passenger;
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Find groups by trajectory (DBScan/K-Means algorithm simulation)
 * @param {Object} searchCriteria - Search parameters
 * @returns {Array} List of matching groups
 */
const findGroupsByTrajectory = async (searchCriteria) => {
  try {
    const {
      startLat, startLon, endLat, endLon,
      startTime, maxDistance, maxDetourTime
    } = searchCriteria;
    
    // Here we would implement a clustering algorithm like DBSCAN or K-Means
    // This is a simplified version that searches based on geographical coordinates
    
    // For this demo, we'll use a simple distance calculation to find nearby groups
    const matchingGroups = await Group.findAll({
      where: {
        status: 0, // Open groups only
        start_timestamp: {
          [sequelize.Op.between]: [startTime - maxDetourTime, startTime + maxDetourTime]
        }
      },
      include: [
        {
          model: Member,
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'url', 'email', 'phone']
            }
          ]
        }
      ]
    });
    
    // Filter groups by location proximity - this is simplified
    // In a real app, you would use more advanced geospatial queries
    const filteredGroups = matchingGroups.filter(group => {
      if (!group.origin_lat || !group.origin_lon || !group.destination_lat || !group.destination_lon) {
        return false;
      }
      
      // Calculate distance between points (Euclidean distance for simplicity)
      // In a real app, you'd use the Haversine formula or a proper geospatial library
      const startDistance = Math.sqrt(
        Math.pow(group.origin_lat - startLat, 2) + 
        Math.pow(group.origin_lon - startLon, 2)
      );
      
      const endDistance = Math.sqrt(
        Math.pow(group.destination_lat - endLat, 2) + 
        Math.pow(group.destination_lon - endLon, 2)
      );
      
      // Filter based on max distance (this is a simplified approximation)
      return startDistance <= maxDistance && endDistance <= maxDistance;
    });
    
    // Additional filtering based on available seats, etc.
    return filteredGroups.filter(group => {
      const memberCount = group.Members.length;
      return memberCount < group.limit_passenger;
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get all groups where a user is a member
 * @param {number} userId - User ID
 * @returns {Array} List of groups with all members
 */
const getUserGroups = async (userId) => {
  try {
    const memberships = await Member.findAll({
      where: { user_id: userId },
      attributes: ['group_id']
    });
    
    const groupIds = memberships.map(m => m.group_id);
    
    if (groupIds.length === 0) {
      return [];
    }
    
    // Get all groups where the user is a member
    const groups = await Group.findAll({
      where: {
        id: {
          [sequelize.Op.in]: groupIds
        }
      },
      include: [
        {
          model: Member,
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'url', 'email', 'phone']
            }
          ]
        }
      ],
      order: [['start_timestamp', 'DESC']]
    });
    
    return groups;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user's current active group (if any)
 * @param {number} userId - User ID
 * @returns {Object} Group object if active, null otherwise
 */
const getUserActiveGroup = async (userId) => {
  try {
    const memberships = await Member.findAll({
      where: { user_id: userId },
      attributes: ['group_id']
    });
    
    const groupIds = memberships.map(m => m.group_id);
    
    if (groupIds.length === 0) {
      return null;
    }
    
    // Get active group (status 0, 1, or 2) where the user is a member
    const activeGroup = await Group.findOne({
      where: {
        id: {
          [sequelize.Op.in]: groupIds
        },
        status: {
          [sequelize.Op.in]: [0, 1, 2] // Open, Full, or In Progress
        }
      },
      include: [
        {
          model: Member,
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'url', 'email', 'phone']
            }
          ]
        }
      ]
    });
    
    return activeGroup;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a group from a driver's activity chain
 * @param {number} chainId - Activity chain ID
 * @param {number} driverUserId - User ID of the driver
 * @param {number} limitPassenger - Maximum number of passengers
 * @param {Object} vehicleDetails - Details about the vehicle
 * @returns {Object} Created group with driver member
 */
const createGroupFromActivityChain = async (chainId, driverUserId, limitPassenger = 4, vehicleDetails = {}) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Check if the activity chain exists and belongs to the driver
    const activityChain = await ActivityChain.findOne({
      where: { 
        id: chainId,
        user_id: driverUserId,
        is_driver: true
      },
      include: [{
        model: Activity,
        order: [['sequence_order', 'ASC']]
      }],
      transaction
    });
    
    if (!activityChain) {
      await transaction.rollback();
      throw new Error('Activity chain not found or not authorized');
    }
    
    if (!activityChain.is_driver) {
      await transaction.rollback();
      throw new Error('Activity chain is not marked as driver');
    }
    
    // Get the activities from the chain
    const activities = activityChain.Activities;
    
    if (!activities || activities.length === 0) {
      await transaction.rollback();
      throw new Error('Activity chain must have at least one activity');
    }
    
    // Get first and last activity for origin and destination
    const firstActivity = activities[0];
    const lastActivity = activities[activities.length - 1];
    
    // Create group data from the activity chain
    const groupData = {
      limit_passenger: limitPassenger,
      start_timestamp: firstActivity.activity_time,
      type: 0, // 0 for activity-based match
      status: 0, // 0 for Open
      timestamp: Date.now(),
      origin_name: firstActivity.location_name,
      origin_lat: firstActivity.start_lat,
      origin_lon: firstActivity.start_lon,
      destination_name: lastActivity.location_name,
      destination_lat: lastActivity.start_lat,
      destination_lon: lastActivity.start_lon,
      // Store route data - this would be calculated based on activities
      route_polyline: JSON.stringify({
        activities: activities.map(a => ({
          id: a.id,
          name: a.activity_name,
          location: a.location_name,
          coordinates: [a.start_lon, a.start_lat],
          time: a.activity_time,
          duration: a.duration
        }))
      })
    };
    
    // Create the group
    const group = await Group.create(groupData, { transaction });
    
    // Create member entry for the driver
    const memberUid = uuidv4();
    await Member.create({
      uid: memberUid,
      user_id: driverUserId,
      group_id: group.id,
      role: 'driver',
      join_timestamp: Date.now()
    }, { transaction });
    
    // Link the group to the activity chain (this could be done in a join table in a more complex implementation)
    await activityChain.update({
      group_id: group.id
    }, { transaction });
    
    await transaction.commit();
    
    // Return the created group with its members
    return await getGroupById(group.id);
  } catch (error) {
    // Only rollback if the transaction hasn't been committed yet
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
};

/**
 * Find potential passenger matches for a driver's group based on activity chain
 * @param {number} chainId - Driver's activity chain ID 
 * @param {number} groupId - Driver's group ID
 * @param {number} driverUserId - User ID of the driver
 * @returns {Array} List of potential passenger matches
 */
const findPotentialPassengerMatches = async (chainId, groupId, driverUserId) => {
  try {
    // Verify the driver owns this group and chain
    const membership = await Member.findOne({
      where: {
        group_id: groupId,
        user_id: driverUserId,
        role: 'driver'
      }
    });
    
    if (!membership) {
      throw new Error('Group not found or not authorized');
    }
    
    // Get the driver's activity chain
    const driverChain = await ActivityChain.findOne({
      where: { 
        id: chainId,
        user_id: driverUserId,
        is_driver: true
      },
      include: [{
        model: Activity,
        order: [['sequence_order', 'ASC']]
      }]
    });
    
    if (!driverChain) {
      throw new Error('Activity chain not found or not authorized');
    }
    
    // Get all passenger chains that aren't matched yet
    const passengerChains = await ActivityChain.findAll({
      where: { 
        is_passenger: true,
        matched_driver_chain_id: null
      },
      include: [
        {
          model: Activity,
          order: [['sequence_order', 'ASC']]
        },
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });
    
    if (!passengerChains.length) {
      return [];
    }
    
    // Find compatible passenger chains
    const matches = [];
    const timeWindow = 30 * 60 * 1000; // 30 minutes in milliseconds
    const maxDistance = 2000; // 2km in meters
    
    for (const passengerChain of passengerChains) {
      // Skip if passenger is the driver
      if (passengerChain.user_id === driverUserId) {
        continue;
      }
      
      const passengerActivities = passengerChain.Activities;
      const driverActivities = driverChain.Activities;
      
      // Skip if no activities
      if (!passengerActivities.length || !driverActivities.length) {
        continue;
      }
      
      // Check compatibility between passenger and driver activities
      let compatibleActivities = 0;
      let matchedActivities = [];
      
      for (const passengerActivity of passengerActivities) {
        for (const driverActivity of driverActivities) {
          // Check if activities are within time window
          const timeDiff = Math.abs(passengerActivity.activity_time - driverActivity.activity_time);
          
          if (timeDiff <= timeWindow) {
            // Calculate distance between activities (simplified)
            const distance = Math.sqrt(
              Math.pow(passengerActivity.start_lat - driverActivity.start_lat, 2) + 
              Math.pow(passengerActivity.start_lon - driverActivity.start_lon, 2)
            ) * 111000; // Rough conversion to meters
            
            // Check if within maximum distance
            if (distance <= maxDistance) {
              compatibleActivities++;
              matchedActivities.push({
                passengerActivity,
                driverActivity,
                timeDiff,
                distance
              });
              break; // Found a match for this passenger activity
            }
          }
        }
      }
      
      // Calculate compatibility score (percentage of passenger activities matched)
      const compatibilityScore = compatibleActivities / passengerActivities.length;
      
      // If at least one activity is compatible, add to matches
      if (compatibilityScore > 0) {
        matches.push({
          passengerChain,
          passenger: passengerChain.User,
          compatibilityScore,
          compatibleActivities,
          totalActivities: passengerActivities.length,
          matchedActivities
        });
      }
    }
    
    // Sort matches by compatibility score (highest first)
    matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    
    return matches;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createGroup,
  getGroupById,
  updateGroup,
  deleteGroup,
  findGroupsByActivity,
  findGroupsByTrajectory,
  getUserGroups,
  getUserActiveGroup,
  createGroupFromActivityChain,
  findPotentialPassengerMatches
};