import axios from 'axios';

// Nominatim API for geocoding
const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';
// OSRM API for routing
const OSRM_API = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Convert an address to coordinates using Nominatim
 * @param {string} address - Address to geocode
 * @returns {Promise<{lat: number, lon: number}>} - Coordinates
 */
export const geocodeAddress = async (address) => {
  try {
    // Add delay between requests to avoid being rate-limited by Nominatim
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const response = await axios.get(NOMINATIM_API, {
      params: {
        q: address,
        format: 'json',
        limit: 1,
      },
      headers: {
        'User-Agent': 'RideSharingApp'
      },
      // Add timeout to avoid hanging requests
      timeout: 8000
    });

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return { lat: parseFloat(lat), lon: parseFloat(lon) };
    } else {
      // If no results found, throw a clear error
      throw new Error(`No results found for address: ${address}`);
    }
  } catch (error) {
    // More detailed error handling
    if (error.code === 'ECONNABORTED') {
      console.error('Geocoding timeout:', error);
      throw new Error('Geocoding request timed out. Please try again.');
    } else if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Geocoding server error:', error.response.status, error.response.data);
      throw new Error(`Geocoding server error: ${error.response.status}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No geocoding response received:', error.request);
      throw new Error('No response received from geocoding service');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Geocoding error:', error.message);
      throw new Error(`Failed to geocode address: ${error.message}`);
    }
  }
};

/**
 * Get a route between two coordinates using OSRM
 * @param {Object} startCoords - Starting coordinates {lat, lon}
 * @param {Object} endCoords - Ending coordinates {lat, lon}
 * @returns {Promise<Object>} - Route details
 */
export const getRoute = async (startCoords, endCoords) => {
  try {
    // Format coordinates for OSRM: lon,lat
    const from = `${startCoords.lon},${startCoords.lat}`;
    const to = `${endCoords.lon},${endCoords.lat}`;
    
    const response = await axios.get(`${OSRM_API}/${from};${to}`, {
      params: {
        overview: 'full',
        geometries: 'geojson',
        steps: true,
      }
    });

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      return {
        route: response.data.routes[0].geometry,
        distance: response.data.routes[0].distance,
        duration: response.data.routes[0].duration,
        steps: response.data.routes[0].legs[0].steps
      };
    } else {
      throw new Error('No route found');
    }
  } catch (error) {
    console.error('Routing error:', error);
    throw new Error('Failed to calculate route');
  }
};

/**
 * Check if a route passes through or near a point
 * @param {Object} route - GeoJSON route
 * @param {Object} point - Point coordinates {lat, lon}
 * @param {number} threshold - Distance threshold in meters
 * @returns {boolean} - Whether the route passes near the point
 */
export const routePassesNearPoint = (route, point, threshold = 1000) => {
  // Simple implementation - in a real app, this would use turf.js or similar
  // to calculate the actual distance from the point to the nearest point on the route
  if (!route || !route.coordinates) return false;
  
  for (const coord of route.coordinates) {
    const [lon, lat] = coord;
    const distance = calculateDistance(
      { lat: point.lat, lon: point.lon },
      { lat, lon }
    );
    if (distance <= threshold) {
      return true;
    }
  }
  return false;
};

/**
 * Calculate the distance between two points in meters (Haversine formula)
 * @param {Object} point1 - First point {lat, lon}
 * @param {Object} point2 - Second point {lat, lon}
 * @returns {number} - Distance in meters
 */
export const calculateDistance = (point1, point2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lon - point1.lon) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};