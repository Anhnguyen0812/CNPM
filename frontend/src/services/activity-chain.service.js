import api from './api.service';

/**
 * Get user's activity chains
 * @returns {Promise<Array>} List of user's activity chains
 */
export const getUserActivityChains = async () => {
  try {
    const response = await api.get('/activities/me/activity-chains');
    
    // Kiểm tra dữ liệu trả về từ API
    if (!response || !response.data) {
      console.error('Activity chains API returned invalid response:', response);
      return [];
    }
    
    return response.data.activityChains;
  } catch (error) {
    console.error('Error fetching user activity chains:', error);
    
    // Trả về mảng rỗng thay vì ném lỗi để tránh lỗi "You don't have any activity chains yet"
    return [];
  }
};

/**
 * Create a new activity chain
 * @param {Object} chainData - Data for creating a new activity chain
 * @returns {Promise<Object>} Created activity chain
 */
export const createActivityChain = async (chainData) => {
  try {
    const response = await api.post('/activities/me/activity-chains', chainData);
    
    // Đảm bảo khi tạo mới activity chain sẽ trả về dữ liệu
    if (!response || !response.data) {
      throw new Error('Failed to create activity chain: API returned invalid response');
    }
    
    return response.data.activityChain;
  } catch (error) {
    console.error('Error creating activity chain:', error);
    throw new Error(error.response?.data?.message || 'Failed to create activity chain');
  }
};

/**
 * Get activities in a chain
 * @param {string} chainId - ID of the activity chain
 * @returns {Promise<Array>} List of activities in the chain
 */
export const getActivitiesByChainId = async (chainId) => {
  try {
    const response = await api.get(`/activities/me/activity-chains/${chainId}/activities`);
    return response.data.activities;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch activities for chain' };
  }
};

/**
 * Create a new activity in a chain
 * @param {string} chainId - ID of the activity chain
 * @param {Object} activityData - Data for creating a new activity
 * @returns {Promise<Object>} Created activity
 */
export const createActivityInChain = async (chainId, activityData) => {
  try {
    const response = await api.post(`/activities/me/activity-chains/${chainId}/activities`, activityData);
    return response.data.activity;
  } catch (error) {
    console.error('Error creating activity in chain:', error);
    throw new Error(error.response?.data?.message || 'Failed to create activity in chain');
  }
};

/**
 * Reorder activities in a chain
 * @param {string} chainId - ID of the activity chain
 * @param {Array} activityOrder - Array of activity IDs in the new order
 * @returns {Promise<Array>} Reordered activities
 */
export const reorderActivities = async (chainId, activityOrder) => {
  try {
    const response = await api.post(`/activities/me/activity-chains/${chainId}/activities/reorder`, { activityOrder });
    return response.data.activities;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to reorder activities' };
  }
};

/**
 * Mark an activity chain as a driver's trip
 * @param {string} chainId - ID of the activity chain
 * @param {Object} vehicleDetails - Vehicle details for the trip
 * @returns {Promise<Object>} Updated activity chain
 */

/**
 * Mark an activity chain as a passenger's trip
 * @param {string} chainId - ID of the activity chain
 * @param {Object} preferences - Passenger preferences for the trip
 * @returns {Promise<Object>} Updated activity chain
 */
export const markAsPassengerChain = async (chainId, preferences) => {
  try {
    const response = await api.post(`/activities/me/activity-chains/${chainId}/passenger`, { preferences });
    return response.data.data;
  } catch (error) {
    console.error('Error marking chain as passenger:', error);
    throw new Error(error.response?.data?.message || 'Failed to mark chain as passenger');
  }
};

/**
 * Find matching drivers for an activity chain
 * @param {string} chainId - ID of the passenger's activity chain
 * @param {number} timeWindow - Time window in minutes (default: 15)
 * @param {number} maxDistance - Maximum distance in meters (default: 2000)
 * @returns {Promise<Array>} List of matching drivers
 */
export const findMatchingDrivers = async (chainId, timeWindow = 15, maxDistance = 2000) => {
  try {
    const response = await api.get(`/activities/me/passenger/matches`, {
      params: { chainId, timeWindow, maxDistance }
    });
    
    return response.data.matches;
  } catch (error) {
    console.error('Error finding matching drivers:', error);
    
    // Kiểm tra lỗi cụ thể về chuỗi hoạt động
    if (error.response && error.response.status === 404) {
      throw new Error('Activity chain not found or no matching drivers available');
    }
    
    throw new Error(error.response?.data?.message || 'Failed to find matching drivers');
  }
};

/**
 * Accept a driver match for a passenger's activity chain
 * @param {string} passengerChainId - ID of the passenger's activity chain
 * @param {string} driverChainId - ID of the driver's activity chain
 * @returns {Promise<Object>} Match details
 */
export const acceptDriverMatch = async (passengerChainId, driverChainId) => {
  try {
    const response = await api.post(`/activities/me/passenger/accept-match`, {
      passengerChainId,
      driverChainId
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error accepting driver match:', error);
    throw new Error(error.response?.data?.message || 'Failed to accept driver match');
  }
};

/**
 * Delete an activity chain
 * @param {string} chainId - ID of the activity chain
 * @returns {Promise<Object>} Deleted activity chain
 */
export const deleteActivityChain = async (chainId) => {
  try {
    const response = await api.delete(`/activities/me/activity-chains/${chainId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting activity chain:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete activity chain');
  }
};

/**
 * Update an activity chain
 * @param {string} chainId - ID of the activity chain
 * @param {Object} chainData - Data for updating the activity chain
 * @returns {Promise<Object>} Updated activity chain
 */
export const updateActivityChain = async (chainId, chainData) => {
  try {
    const response = await api.put(`/activities/me/activity-chains/${chainId}`, chainData);
    return response.data;
  } catch (error) {
    console.error('Error updating activity chain:', error);
    throw new Error(error.response?.data?.message || 'Failed to update activity chain');
  }
};

// Add this function to explicitly mark a chain as a driver chain
export const markAsDriverChain = async (chainId, data = {}) => {
  try {
    const response = await api.post(`/activities/me/activity-chains/${chainId}/driver`, data);
    
    // Nếu đánh dấu thành công, tự động tạo nhóm đi chung và tìm kiếm hành khách
    if (response.data && response.data.data) {
      try {
        // Gọi API để tạo nhóm từ chuỗi hoạt động của tài xế
        const groupResponse = await api.post('/groups/create-from-chain', {
          chainId: chainId,
          limitPassenger: data.limitPassenger || 4,
          vehicleDetails: data.vehicleDetails || {}
        });
        
        // Kiểm tra nếu nhóm được tạo thành công
        if (groupResponse.data && groupResponse.data.group) {
          console.log('Group created successfully:', groupResponse.data.group);
          
          // Tìm kiếm hành khách tiềm năng dựa trên chuỗi hoạt động
          const matchResponse = await api.get('/groups/find-passenger-matches', {
            params: { chainId, groupId: groupResponse.data.group.id }
          });
          
          if (matchResponse.data && matchResponse.data.matches) {
            console.log('Found potential passengers:', matchResponse.data.matches.length);
            // Dữ liệu matches có thể được sử dụng để hiển thị cho tài xế
            return {
              ...response.data,
              group: groupResponse.data.group,
              potentialPassengers: matchResponse.data.matches
            };
          }
        }
      } catch (groupError) {
        console.error('Error creating group or finding matches:', groupError);
        // Tiếp tục trả về dữ liệu activity chain ngay cả khi việc tạo nhóm thất bại
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Error marking chain as driver:', error);
    throw error;
  }
};