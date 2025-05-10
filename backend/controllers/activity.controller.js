const activityService = require('../services/activity.service');

/**
 * Get a specific activity by ID
 */
const getActivityById = async (req, res) => {
  try {
    const userId = req.user.id;
    const activityId = req.params.activityId;
    
    const activity = await activityService.getActivityById(activityId, userId);
    
    return res.status(200).json({ activity });
  } catch (error) {
    console.error('Error getting activity:', error);
    if (error.message === 'Activity not found or not authorized') {
      return res.status(404).json({ message: 'Activity not found or not authorized' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update an activity
 */
const updateActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const activityId = req.params.activityId;
    const activityData = req.body;
    
    const activity = await activityService.updateActivity(activityId, userId, activityData);
    
    return res.status(200).json({
      message: 'Activity updated successfully',
      activity
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    if (error.message === 'Activity not found or not authorized') {
      return res.status(404).json({ message: 'Activity not found or not authorized' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete an activity
 */
const deleteActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const activityId = req.params.activityId;
    
    await activityService.deleteActivity(activityId, userId);
    
    return res.status(200).json({
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    if (error.message === 'Activity not found or not authorized') {
      return res.status(404).json({ message: 'Activity not found or not authorized' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getActivityById,
  updateActivity,
  deleteActivity
};