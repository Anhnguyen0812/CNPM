const { Activity, ActivityChain, sequelize } = require('../models');

/**
 * Get all activities for a specific activity chain
 * @param {number} chainId - Activity chain ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Array} List of activities
 */
const getActivitiesByChainId = async (chainId, userId) => {
  try {
    // First check if the chain belongs to the user
    const chain = await ActivityChain.findOne({
      where: { 
        id: chainId,
        user_id: userId
      }
    });
    
    if (!chain) {
      throw new Error('Activity chain not found or not authorized');
    }
    
    // Get all activities for this chain, ordered by sequence
    const activities = await Activity.findAll({
      where: { activity_chain_id: chainId },
      order: [['sequence_order', 'ASC']]
    });
    
    return activities;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a specific activity by ID
 * @param {number} activityId - Activity ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Object} Activity object
 */
const getActivityById = async (activityId, userId) => {
  try {
    const activity = await Activity.findByPk(activityId, {
      include: [
        {
          model: ActivityChain,
          where: { user_id: userId }
        }
      ]
    });
    
    if (!activity) {
      throw new Error('Activity not found or not authorized');
    }
    
    return activity;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new activity in an activity chain
 * @param {number} chainId - Activity chain ID
 * @param {number} userId - User ID (for authorization)
 * @param {Object} activityData - Activity data
 * @returns {Object} Created activity
 */
const createActivity = async (chainId, userId, activityData) => {
  try {
    // First check if the chain belongs to the user
    const chain = await ActivityChain.findOne({
      where: { 
        id: chainId,
        user_id: userId
      }
    });
    
    if (!chain) {
      throw new Error('Activity chain not found or not authorized');
    }
    
    // Get the highest sequence_order to add this activity at the end
    const maxSequence = await Activity.max('sequence_order', {
      where: { activity_chain_id: chainId }
    }) || -1;
    
    // Ensure activity_time is a valid BIGINT
    let processedData = { ...activityData };
    
    // Convert activity_time to BIGINT if it exists
    if (processedData.activity_time) {
      // If it's a Date object or date string, convert to timestamp
      if (processedData.activity_time instanceof Date) {
        processedData.activity_time = Math.floor(processedData.activity_time.getTime());
      } else if (typeof processedData.activity_time === 'string' && !isNaN(Date.parse(processedData.activity_time))) {
        processedData.activity_time = Math.floor(new Date(processedData.activity_time).getTime());
      } else {
        // If it's already a number, ensure it's an integer
        processedData.activity_time = Math.floor(Number(processedData.activity_time));
      }
      
      // Validate that it's a valid number after conversion
      if (isNaN(processedData.activity_time)) {
        throw new Error('Invalid activity_time format');
      }
    }
    
    // Ensure these fields are included if provided
    const fieldsToCheck = ['start_place', 'start_lat', 'start_lon', 'end_place', 'end_lat', 'end_lon', 'is_flexible'];
    fieldsToCheck.forEach(field => {
      if (field in activityData) {
        processedData[field] = activityData[field];
      }
    });
    
    // Create the activity
    const activity = await Activity.create({
      ...processedData,
      activity_chain_id: chainId,
      sequence_order: maxSequence + 1,
      timestamp: Date.now()
    });
    
    return activity;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an activity
 * @param {number} activityId - Activity ID
 * @param {number} userId - User ID (for authorization)
 * @param {Object} activityData - Activity data to update
 * @returns {Object} Updated activity
 */
const updateActivity = async (activityId, userId, activityData) => {
  try {
    const activity = await Activity.findByPk(activityId, {
      include: [
        {
          model: ActivityChain,
          where: { user_id: userId }
        }
      ]
    });
    
    if (!activity) {
      throw new Error('Activity not found or not authorized');
    }
    
    // Don't allow changing the chain ID through this method
    delete activityData.activity_chain_id;
    
    // Ensure activity_time is a valid BIGINT
    let processedData = { ...activityData };
    
    // Convert activity_time to BIGINT if it exists
    if (processedData.activity_time) {
      // If it's a Date object or date string, convert to timestamp
      if (processedData.activity_time instanceof Date) {
        processedData.activity_time = Math.floor(processedData.activity_time.getTime());
      } else if (typeof processedData.activity_time === 'string' && !isNaN(Date.parse(processedData.activity_time))) {
        processedData.activity_time = Math.floor(new Date(processedData.activity_time).getTime());
      } else {
        // If it's already a number, ensure it's an integer
        processedData.activity_time = Math.floor(Number(processedData.activity_time));
      }
      
      // Validate that it's a valid number after conversion
      if (isNaN(processedData.activity_time)) {
        throw new Error('Invalid activity_time format');
      }
    }
    
    // Ensure these fields are included if provided
    const fieldsToCheck = ['start_place', 'start_lat', 'start_lon', 'end_place', 'end_lat', 'end_lon', 'is_flexible'];
    fieldsToCheck.forEach(field => {
      // Explicitly handle boolean values which might be false
      if (field in activityData) {
        processedData[field] = activityData[field];
      }
    });
    
    // Update the activity
    await activity.update(processedData);
    
    return activity;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete an activity
 * @param {number} activityId - Activity ID
 * @param {number} userId - User ID (for authorization)
 * @returns {boolean} True if deleted successfully
 */
const deleteActivity = async (activityId, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const activity = await Activity.findByPk(activityId, {
      include: [
        {
          model: ActivityChain,
          where: { user_id: userId }
        }
      ],
      transaction
    });
    
    if (!activity) {
      await transaction.rollback();
      throw new Error('Activity not found or not authorized');
    }
    
    const chainId = activity.activity_chain_id;
    const currentSequence = activity.sequence_order;
    
    // Delete the activity
    await activity.destroy({ transaction });
    
    // Reorder remaining activities to maintain sequence
    await Activity.update(
      { sequence_order: sequelize.literal('sequence_order - 1') },
      { 
        where: { 
          activity_chain_id: chainId,
          sequence_order: { [sequelize.Op.gt]: currentSequence }
        },
        transaction
      }
    );
    
    await transaction.commit();
    
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Reorder activities in a chain
 * @param {number} chainId - Activity chain ID
 * @param {number} userId - User ID (for authorization)
 * @param {Array} activityOrder - Array of activity IDs in the new order
 * @returns {Array} Reordered activities
 */
const reorderActivities = async (chainId, userId, activityOrder) => {
  const transaction = await sequelize.transaction();
  
  try {
    // First check if the chain belongs to the user
    const chain = await ActivityChain.findOne({
      where: { 
        id: chainId,
        user_id: userId
      },
      transaction
    });
    
    if (!chain) {
      await transaction.rollback();
      throw new Error('Activity chain not found or not authorized');
    }
    
    // Get all activities in this chain
    const activities = await Activity.findAll({
      where: { activity_chain_id: chainId },
      transaction
    });
    
    // Make sure all activities in the new order belong to this chain
    const activityIds = activities.map(a => a.id);
    const allActivitiesExist = activityOrder.every(id => activityIds.includes(id));
    
    if (!allActivitiesExist || activityOrder.length !== activities.length) {
      await transaction.rollback();
      throw new Error('Invalid activity order');
    }
    
    // Update sequence for each activity in the new order
    const updatePromises = activityOrder.map((activityId, index) => {
      return Activity.update(
        { sequence_order: index },
        { 
          where: { id: activityId },
          transaction
        }
      );
    });
    
    await Promise.all(updatePromises);
    
    await transaction.commit();
    
    // Return the reordered activities
    return getActivitiesByChainId(chainId, userId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  getActivitiesByChainId,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  reorderActivities
};