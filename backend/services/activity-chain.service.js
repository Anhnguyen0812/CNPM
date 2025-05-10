const { ActivityChain, Activity, sequelize } = require('../models');

/**
 * Get all activity chains for a user
 * @param {number} userId - User ID
 * @returns {Array} List of activity chains with associated activities
 */
const getUserActivityChains = async (userId) => {
  try {
    const activityChains = await ActivityChain.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Activity,
          order: [['sequence_order', 'ASC']]
        }
      ]
    });
    
    return activityChains;
  } catch (error) {
    throw error;
  }
};

/**
 * Get activity chain by ID
 * @param {number} chainId - Activity chain ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Object} Activity chain with associated activities
 */
const getActivityChainById = async (chainId, userId) => {
  try {
    const activityChain = await ActivityChain.findOne({
      where: { 
        id: chainId,
        user_id: userId
      },
      include: [
        {
          model: Activity,
          order: [['sequence_order', 'ASC']]
        }
      ]
    });
    
    if (!activityChain) {
      throw new Error('Activity chain not found or not authorized');
    }
    
    return activityChain;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new activity chain for a user
 * @param {number} userId - User ID
 * @param {Object} chainData - Activity chain data
 * @returns {Object} Created activity chain
 */
const createActivityChain = async (userId, chainData) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Creating activity chain with data:', chainData);
    
    // Create activity chain with current timestamp
    const activityChain = await ActivityChain.create({
      user_id: userId,
      name: chainData.name,
      is_driver: chainData.is_driver || false,
      is_passenger: chainData.is_passenger || false,
      timestamp: Date.now()
    }, { transaction });
    
    // Create activities if provided
    if (chainData.activities && Array.isArray(chainData.activities) && chainData.activities.length > 0) {
      const activities = chainData.activities.map((activity, index) => ({
        ...activity,
        activity_chain_id: activityChain.id,
        sequence_order: index,
        timestamp: Date.now()
      }));
      
      await Activity.bulkCreate(activities, { transaction });
    }
    
    await transaction.commit();
    
    // Retrieve and return the newly created chain with its activities
    // Note: We're querying outside the transaction since it's already committed
    const createdChain = await ActivityChain.findOne({
      where: { 
        id: activityChain.id,
        user_id: userId
      },
      include: [
        {
          model: Activity,
          order: [['sequence_order', 'ASC']]
        }
      ]
    });
    
    console.log('Chain created successfully with is_driver:', createdChain.is_driver);
    return createdChain;
  } catch (error) {
    console.error('Error in createActivityChain:', error);
    // Only rollback if the transaction hasn't been committed yet
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
};

/**
 * Update an activity chain
 * @param {number} chainId - Activity chain ID
 * @param {number} userId - User ID (for authorization)
 * @param {Object} chainData - Activity chain data to update
 * @returns {Object} Updated activity chain
 */
const updateActivityChain = async (chainId, userId, chainData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const activityChain = await ActivityChain.findOne({
      where: { 
        id: chainId,
        user_id: userId
      },
      transaction
    });
    
    if (!activityChain) {
      await transaction.rollback();
      throw new Error('Activity chain not found or not authorized');
    }
    
    // Update activity chain
    await activityChain.update({
      name: chainData.name
    }, { transaction });
    
    await transaction.commit();
    
    // Return the updated chain with its activities
    return getActivityChainById(chainId, userId);
  } catch (error) {
    // Only rollback if the transaction hasn't been committed yet
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
};

/**
 * Delete an activity chain and all associated activities
 * @param {number} chainId - Activity chain ID
 * @param {number} userId - User ID (for authorization)
 * @returns {boolean} True if deleted successfully
 */
const deleteActivityChain = async (chainId, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const activityChain = await ActivityChain.findOne({
      where: { 
        id: chainId,
        user_id: userId
      },
      transaction
    });
    
    if (!activityChain) {
      await transaction.rollback();
      throw new Error('Activity chain not found or not authorized');
    }
    
    // Delete all activities in this chain
    await Activity.destroy({
      where: { activity_chain_id: chainId },
      transaction
    });
    
    // Delete the activity chain
    await activityChain.destroy({ transaction });
    
    await transaction.commit();
    
    return true;
  } catch (error) {
    // Only rollback if the transaction hasn't been committed yet
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
};

/**
 * Mark an activity chain as a driver's trip
 * @param {number} chainId - Activity chain ID
 * @param {number} userId - User ID (for authorization)
 * @param {Object} vehicleDetails - Details about the driver's vehicle
 * @returns {Object} Updated activity chain
 */
const markAsDriverChain = async (chainId, userId, vehicleDetails) => {
  try {
    const activityChain = await ActivityChain.findOne({
      where: { 
        id: chainId,
        user_id: userId
      }
    });
    
    if (!activityChain) {
      throw new Error('Activity chain not found or not authorized');
    }
    
    // Update chain to mark as driver trip
    await activityChain.update({
      is_driver: true,
      is_passenger: false,
      vehicle_details: JSON.stringify(vehicleDetails || {})
    });
    
    return getActivityChainById(chainId, userId);
  } catch (error) {
    throw error;
  }
};

/**
 * Mark an activity chain as a passenger's trip
 * @param {number} chainId - Activity chain ID
 * @param {number} userId - User ID (for authorization)
 * @param {Object} preferences - Passenger preferences
 * @returns {Object} Updated activity chain
 */
const markAsPassengerChain = async (chainId, userId, preferences) => {
  try {
    const activityChain = await ActivityChain.findOne({
      where: { 
        id: chainId,
        user_id: userId
      }
    });
    
    if (!activityChain) {
      throw new Error('Activity chain not found or not authorized');
    }
    
    // Update chain to mark as passenger trip
    await activityChain.update({
      is_driver: false,
      is_passenger: true,
      passenger_preferences: JSON.stringify(preferences || {})
    });
    
    return getActivityChainById(chainId, userId);
  } catch (error) {
    throw error;
  }
};

/**
 * Get all driver activity chains
 * @returns {Array} List of driver activity chains
 */
const getAllDriverChains = async () => {
  try {
    const driverChains = await ActivityChain.findAll({
      where: { is_driver: true },
      include: [
        {
          model: Activity,
          order: [['sequence_order', 'ASC']]
        }
      ]
    });
    
    return driverChains;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getUserActivityChains,
  getActivityChainById,
  createActivityChain,
  updateActivityChain,
  deleteActivityChain,
  markAsDriverChain,
  markAsPassengerChain,
  getAllDriverChains
};