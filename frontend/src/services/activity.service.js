import api from './api.service';

/**
 * Get all activities available in the system
 * @returns {Promise<Array>} List of activities
 */
export const getAllActivities = async () => {
  try {
    const response = await api.get('/activities');
    return response.data.activities;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch activities' };
  }
};

/**
 * Get activity by ID
 * @param {string} activityId - ID of the activity to fetch
 * @returns {Promise<Object>} Activity details
 */
export const getActivityById = async (activityId) => {
  try {
    const response = await api.get(`/activities/${activityId}`);
    return response.data.activity;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch activity details' };
  }
};

/**
 * Create a new activity 
 * @param {Object} activityData - Data for creating new activity
 * @returns {Promise<Object>} Created activity
 */
export const createActivity = async (activityData) => {
  try {
    const response = await api.post('/activities', activityData);
    return response.data.activity;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create activity' };
  }
};