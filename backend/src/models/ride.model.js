const { pool } = require('../config/db.config');

// Ride model with database operations
const Ride = {
  // Create a new ride request
  create: async (rideData) => {
    const {
      customer_id,
      driver_id,
      vehicle_id,
      activity_id,
      pickup_location,
      pickup_latitude,
      pickup_longitude,
      dropoff_location,
      dropoff_latitude,
      dropoff_longitude,
      distance,
      duration,
      price,
      ride_type,
      scheduled_time
    } = rideData;
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO rides (
          customer_id, driver_id, vehicle_id, activity_id,
          pickup_location, pickup_latitude, pickup_longitude,
          dropoff_location, dropoff_latitude, dropoff_longitude,
          distance, duration, price, ride_type, scheduled_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customer_id,
          driver_id || null,
          vehicle_id || null,
          activity_id || null,
          pickup_location,
          pickup_latitude,
          pickup_longitude,
          dropoff_location,
          dropoff_latitude,
          dropoff_longitude,
          distance,
          duration,
          price,
          ride_type,
          scheduled_time || null
        ]
      );
      
      return { id: result.insertId, ...rideData, status: 'requested' };
    } catch (error) {
      throw error;
    }
  },

  // Find a ride by id
  findById: async (id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT r.*, 
          c.name as customer_name, c.phone as customer_phone,
          d.name as driver_name, d.phone as driver_phone,
          v.model as vehicle_model, v.license_plate, v.color as vehicle_color,
          a.name as activity_name
         FROM rides r
         LEFT JOIN users c ON r.customer_id = c.id
         LEFT JOIN users d ON r.driver_id = d.id
         LEFT JOIN vehicles v ON r.vehicle_id = v.id
         LEFT JOIN activities a ON r.activity_id = a.id
         WHERE r.id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },
  
  // Get rides by customer id
  findByCustomerId: async (customerId, options = {}) => {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;
    
    try {
      let query = `
        SELECT r.*, 
          d.name as driver_name, d.phone as driver_phone,
          v.model as vehicle_model, v.license_plate, v.color as vehicle_color,
          a.name as activity_name
         FROM rides r
         LEFT JOIN users d ON r.driver_id = d.id
         LEFT JOIN vehicles v ON r.vehicle_id = v.id
         LEFT JOIN activities a ON r.activity_id = a.id
         WHERE r.customer_id = ?
      `;
      
      const queryParams = [customerId];
      
      if (status) {
        query += ' AND r.status = ?';
        queryParams.push(status);
      }
      
      query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(parseInt(limit), parseInt(offset));
      
      const [rows] = await pool.execute(query, queryParams);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM rides WHERE customer_id = ?';
      const countParams = [customerId];
      
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      return {
        rides: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  },
  
  // Get rides by driver id
  findByDriverId: async (driverId, options = {}) => {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;
    
    try {
      let query = `
        SELECT r.*, 
          c.name as customer_name, c.phone as customer_phone,
          v.model as vehicle_model, v.license_plate, v.color as vehicle_color,
          a.name as activity_name
         FROM rides r
         LEFT JOIN users c ON r.customer_id = c.id
         LEFT JOIN vehicles v ON r.vehicle_id = v.id
         LEFT JOIN activities a ON r.activity_id = a.id
         WHERE r.driver_id = ?
      `;
      
      const queryParams = [driverId];
      
      if (status) {
        query += ' AND r.status = ?';
        queryParams.push(status);
      }
      
      query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(parseInt(limit), parseInt(offset));
      
      const [rows] = await pool.execute(query, queryParams);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM rides WHERE driver_id = ?';
      const countParams = [driverId];
      
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      return {
        rides: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  },
  
  // Get open/requested rides (for drivers to accept)
  findOpenRides: async (options = {}) => {
    const { page = 1, limit = 10, vehicleType, activityId } = options;
    const offset = (page - 1) * limit;
    
    try {
      let query = `
        SELECT r.*, 
          c.name as customer_name, c.phone as customer_phone,
          a.name as activity_name
         FROM rides r
         LEFT JOIN users c ON r.customer_id = c.id
         LEFT JOIN activities a ON r.activity_id = a.id
         WHERE r.status = 'requested'
      `;
      
      const queryParams = [];
      
      if (vehicleType) {
        query += ' AND r.vehicle_type = ?';
        queryParams.push(vehicleType);
      }
      
      if (activityId) {
        query += ' AND r.activity_id = ?';
        queryParams.push(activityId);
      }
      
      query += ' ORDER BY r.created_at ASC LIMIT ? OFFSET ?';
      queryParams.push(parseInt(limit), parseInt(offset));
      
      const [rows] = await pool.execute(query, queryParams);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM rides WHERE status = \'requested\'';
      const countParams = [];
      
      if (vehicleType) {
        countQuery += ' AND vehicle_type = ?';
        countParams.push(vehicleType);
      }
      
      if (activityId) {
        countQuery += ' AND activity_id = ?';
        countParams.push(activityId);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      return {
        rides: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  },
  
  // Accept a ride (driver accepts a ride request)
  acceptRide: async (rideId, driverId, vehicleId) => {
    try {
      const [result] = await pool.execute(
        'UPDATE rides SET driver_id = ?, vehicle_id = ?, status = \'accepted\' WHERE id = ? AND status = \'requested\'',
        [driverId, vehicleId, rideId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },
  
  // Update ride status
  updateStatus: async (rideId, status) => {
    try {
      let updateQuery = 'UPDATE rides SET status = ?';
      const queryParams = [status];
      
      // Add timestamp updates based on status
      if (status === 'in_progress') {
        updateQuery += ', actual_pickup_time = NOW()';
      } else if (status === 'completed') {
        updateQuery += ', actual_dropoff_time = NOW()';
      }
      
      updateQuery += ' WHERE id = ?';
      queryParams.push(rideId);
      
      const [result] = await pool.execute(updateQuery, queryParams);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },
  
  // Add a shared ride (for carpooling)
  addSharedRide: async (sharedRideData) => {
    const {
      ride_id,
      passenger_id,
      pickup_location,
      pickup_latitude,
      pickup_longitude,
      dropoff_location,
      dropoff_latitude,
      dropoff_longitude,
      price
    } = sharedRideData;
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO shared_rides (
          ride_id, passenger_id,
          pickup_location, pickup_latitude, pickup_longitude,
          dropoff_location, dropoff_latitude, dropoff_longitude,
          price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ride_id,
          passenger_id,
          pickup_location,
          pickup_latitude,
          pickup_longitude,
          dropoff_location,
          dropoff_latitude,
          dropoff_longitude,
          price
        ]
      );
      
      return { id: result.insertId, ...sharedRideData, status: 'joined' };
    } catch (error) {
      throw error;
    }
  },
  
  // Get shared rides for a ride
  getSharedRides: async (rideId) => {
    try {
      const [rows] = await pool.execute(
        `SELECT sr.*, u.name as passenger_name, u.phone as passenger_phone
         FROM shared_rides sr
         JOIN users u ON sr.passenger_id = u.id
         WHERE sr.ride_id = ?
         ORDER BY sr.created_at`,
        [rideId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Get rides by activity
  findByActivity: async (activityId, options = {}) => {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;
    
    try {
      let query = `
        SELECT r.*, 
          c.name as customer_name, c.phone as customer_phone,
          d.name as driver_name, d.phone as driver_phone,
          v.model as vehicle_model, v.license_plate, v.color as vehicle_color,
          a.name as activity_name
         FROM rides r
         LEFT JOIN users c ON r.customer_id = c.id
         LEFT JOIN users d ON r.driver_id = d.id
         LEFT JOIN vehicles v ON r.vehicle_id = v.id
         LEFT JOIN activities a ON r.activity_id = a.id
         WHERE r.activity_id = ?
      `;
      
      const queryParams = [activityId];
      
      if (status) {
        query += ' AND r.status = ?';
        queryParams.push(status);
      }
      
      query += ' ORDER BY r.scheduled_time ASC, r.created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(parseInt(limit), parseInt(offset));
      
      const [rows] = await pool.execute(query, queryParams);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM rides WHERE activity_id = ?';
      const countParams = [activityId];
      
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      return {
        rides: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Ride;