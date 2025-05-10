import api from './api.service';

/**
 * Mark an activity chain as a driver's trip
 * @param {string} chainId - Activity chain ID
 * @param {Object} vehicleDetails - Details about the driver's vehicle
 * @returns {Promise<Object>} Updated activity chain
 */
export const markAsDriverChain = async (chainId, vehicleDetails) => {
  try {
    const response = await api.post(`/ride-matching/chains/${chainId}/driver`, {
      vehicleDetails
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to mark chain as driver trip' };
  }
};

/**
 * Mark an activity chain as a passenger's trip
 * @param {string} chainId - Activity chain ID
 * @param {Object} preferences - Passenger preferences
 * @returns {Promise<Object>} Updated activity chain
 */
export const markAsPassengerChain = async (chainId, preferences) => {
  try {
    const response = await api.post(`/ride-matching/chains/${chainId}/passenger`, {
      preferences
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to mark chain as passenger trip' };
  }
};

/**
 * Find matching drivers for a passenger's activity chain using ABRA algorithm
 * @param {string} chainId - Passenger's activity chain ID
 * @param {Object} options - Matching options and ABRA parameters
 * @returns {Promise<Array>} List of matching drivers with compatibility scores
 */
export const findMatchingDrivers = async (chainId, options = {}) => {
  try {
    // Set default options if not provided
    const defaultOptions = {
      timeWindow: 15,
      maxDistance: 2000,
      prioritizeTimeMatching: false,
      enhancedMatching: true,
      considerTraffic: true,
      maxDetourPercent: 25,
      weightTimeFactors: true,
      useTimeFlexibility: false,
      useAbraAlgorithm: true
    };
    
    const searchOptions = { ...defaultOptions, ...options };
    
    // Extract timeWindow and maxDistance for variable naming consistency
    const { timeWindow, maxDistance } = searchOptions;
      console.log('Searching with ABRA options:', searchOptions);
    
    const response = await api.get(`/ride-matching/passenger/matches`, {
      params: {
        ...searchOptions,
        chainId
      }
    });
    
    // Auto-retry with widened parameters if no matches found
    if (response.data.matches && response.data.matches.length === 0 && searchOptions.timeWindow < 30) {
      console.log('No matches found, widening search parameters...');
      return findMatchingDrivers(chainId, {
        ...searchOptions,
        timeWindow: searchOptions.timeWindow + 15,
        maxDistance: searchOptions.maxDistance + 1000
      });
    }
    
    return response.data.matches;
  } catch (error) {
    if (error.response?.status === 404) {
      // If activity chain not found, don't continue searching
      throw error.response?.data || { message: 'Activity chain not found' };
    }
    
    // If server error, try with simpler parameters
    if (error.response?.status === 500 && options.maxDistance > 1000) {
      console.log('Error in search, retrying with simpler parameters...');
      return findMatchingDrivers(chainId, {
        ...options,
        maxDistance: 1000,
        enhancedMatching: false,
        considerTraffic: false,
        useAbraAlgorithm: true
      });
    }
    
    throw error.response?.data || { message: 'Failed to find matching drivers' };
  }
};

/**
 * Accept a driver match for a passenger's activity chain
 * @param {string} passengerChainId - Passenger's activity chain ID
 * @param {string} driverChainId - Driver's activity chain ID
 * @returns {Promise<Object>} Updated passenger chain with match information
 */
export const acceptDriverMatch = async (passengerChainId, driverChainId) => {
  try {
    const response = await api.post(`/ride-matching/passenger/accept-match`, {
      passengerChainId,
      driverChainId
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to accept driver match' };
  }
};

export default {
  markAsDriverChain,
  markAsPassengerChain,
  findMatchingDrivers,
  acceptDriverMatch
};
