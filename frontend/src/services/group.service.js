import api from './api.service';

export const createGroup = async (groupData) => {
  try {
    const response = await api.post('/groups', groupData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create group' };
  }
};

export const getGroupById = async (groupId) => {
  try {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch group details' };
  }
};

export const joinGroup = async (joinData) => {
  try {
    const response = await api.post(`/groups/${joinData.groupId}/join`, joinData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to join group' };
  }
};

export const getUserGroups = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/groups`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch user groups' };
  }
};

export const searchGroups = async (searchParams) => {
  try {
    const response = await api.get('/groups/search', { params: searchParams });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search groups' };
  }
};

/**
 * Search for ride groups based on activity
 * @param {Object} searchData - Activity search parameters
 * @param {Object} searchData.location - User's current location
 * @param {number} searchData.radius - Search radius in km
 * @param {string} searchData.activityId - ID of the activity to search for
 * @returns {Promise<Array>} List of matching ride groups
 */
export const searchGroupsByActivity = async (searchData) => {
  try {
    const response = await api.post('/groups/search/activity', searchData);
    return response.data.results;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search activity-based ride groups' };
  }
};

/**
 * Search for ride groups based on trajectory (start and end points)
 * @param {Object} searchData - Trajectory search parameters
 * @param {Object} searchData.pickup - Pickup location coordinates and name
 * @param {Object} searchData.dropoff - Dropoff location coordinates and name
 * @param {string} searchData.departureTime - ISO string of departure time
 * @param {number} searchData.maxPrice - Maximum price user is willing to pay
 * @param {Object} searchData.preferences - User ride preferences
 * @returns {Promise<Array>} List of matching ride groups
 */
export const searchGroupsByTrajectory = async (searchData) => {
  try {
    const response = await api.post('/groups/search/trajectory', searchData);
    return response.data.results;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search trajectory-based ride groups' };
  }
};

/**
 * Leave a ride group
 * @param {string} groupId - ID of the group to leave
 * @param {string} userId - ID of the user leaving the group
 * @returns {Promise<Object>} Success message
 */
export const leaveGroup = async (groupId, userId) => {
  try {
    const response = await api.post(`/groups/${groupId}/leave`, { userId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to leave group' };
  }
};

/**
 * Create a new ride group as a driver
 * @param {Object} groupData - New group data
 * @returns {Promise<Object>} Created group
 */
export const createRideGroup = async (groupData) => {
  try {
    const response = await api.post('/groups/create', groupData);
    return response.data.group;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create ride group' };
  }
};