const { pool } = require('../config/db.config');

// User model with database operations
const User = {
  // Create a new user
  create: async (userData) => {
    const { email, password, name, phone, role } = userData;
    
    try {
      const [result] = await pool.execute(
        'INSERT INTO users (email, password, name, phone, role) VALUES (?, ?, ?, ?, ?)',
        [email, password, name, phone, role]
      );
      return { id: result.insertId, ...userData };
    } catch (error) {
      throw error;
    }
  },

  // Find a user by id
  findById: async (id) => {
    try {
      const [rows] = await pool.execute(
        'SELECT id, email, name, phone, role, profile_picture, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },
  
  // Find a user by email
  findByEmail: async (email) => {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },
  
  // Update user information
  update: async (id, userData) => {
    const updateFields = [];
    const values = [];
    
    // Dynamically build update query based on provided fields
    Object.keys(userData).forEach(key => {
      if (userData[key] !== undefined && key !== 'id' && key !== 'email') {
        updateFields.push(`${key} = ?`);
        values.push(userData[key]);
      }
    });
    
    if (updateFields.length === 0) {
      return { message: 'No fields to update' };
    }
    
    try {
      const [result] = await pool.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        [...values, id]
      );
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      return { id, ...userData };
    } catch (error) {
      throw error;
    }
  },
  
  // Get user profile (including profile details)
  getProfile: async (id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT u.id, u.email, u.name, u.phone, u.role, u.profile_picture, 
                up.date_of_birth, up.gender, up.bio, up.address, up.preferences 
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },
  
  // Create or update user profile
  updateProfile: async (userId, profileData) => {
    try {
      // Check if profile exists
      const [existingProfiles] = await pool.execute(
        'SELECT * FROM user_profiles WHERE user_id = ?',
        [userId]
      );
      
      if (existingProfiles.length > 0) {
        // Update existing profile
        const updateFields = [];
        const values = [];
        
        Object.keys(profileData).forEach(key => {
          if (profileData[key] !== undefined) {
            updateFields.push(`${key} = ?`);
            values.push(profileData[key]);
          }
        });
        
        if (updateFields.length > 0) {
          await pool.execute(
            `UPDATE user_profiles SET ${updateFields.join(', ')} WHERE user_id = ?`,
            [...values, userId]
          );
        }
      } else {
        // Create new profile
        const fields = Object.keys(profileData);
        const placeholders = fields.map(() => '?').join(', ');
        const values = fields.map(field => profileData[field]);
        
        await pool.execute(
          `INSERT INTO user_profiles (user_id, ${fields.join(', ')}) VALUES (?, ${placeholders})`,
          [userId, ...values]
        );
      }
      
      return { userId, ...profileData };
    } catch (error) {
      throw error;
    }
  },
  
  // Delete a user
  delete: async (id) => {
    try {
      const [result] = await pool.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },
  
  // Get user's activity schedules
  getUserSchedules: async (userId) => {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM user_schedules WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Create a new user schedule
  createSchedule: async (scheduleData) => {
    const { user_id, name } = scheduleData;
    
    try {
      const [result] = await pool.execute(
        'INSERT INTO user_schedules (user_id, name) VALUES (?, ?)',
        [user_id, name]
      );
      return { id: result.insertId, ...scheduleData };
    } catch (error) {
      throw error;
    }
  },

  // Get user's activities for a specific schedule
  getScheduleActivities: async (scheduleId) => {
    try {
      const [rows] = await pool.execute(
        `SELECT ua.*, 
          (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', al.id, 
              'location', al.location, 
              'latitude', al.latitude, 
              'longitude', al.longitude
            )
          ) FROM activity_alternative_locations al WHERE al.activity_id = ua.id) AS alternative_locations
        FROM user_activities ua
        WHERE ua.schedule_id = ?
        ORDER BY ua.start_time`,
        [scheduleId]
      );
      
      // Parse alternative_locations JSON string to object
      return rows.map(row => ({
        ...row,
        alternative_locations: row.alternative_locations ? JSON.parse(row.alternative_locations) : []
      }));
    } catch (error) {
      throw error;
    }
  },

  // Create a new activity in a schedule
  createActivity: async (activityData) => {
    const {
      schedule_id,
      activity_type,
      location,
      latitude,
      longitude,
      start_time,
      end_time,
      days_of_week,
      is_flexible,
      flexibility_radius,
      max_detour_time
    } = activityData;
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO user_activities (
          schedule_id, activity_type, location, latitude, longitude,
          start_time, end_time, days_of_week, is_flexible, flexibility_radius, max_detour_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          schedule_id,
          activity_type,
          location,
          latitude,
          longitude,
          start_time,
          end_time,
          days_of_week,
          is_flexible ? 1 : 0,
          flexibility_radius || 0,
          max_detour_time || 0
        ]
      );
      
      const activityId = result.insertId;
      
      // If alternative locations provided, insert them
      if (activityData.alternative_locations && activityData.alternative_locations.length > 0) {
        const alternativeLocations = activityData.alternative_locations;
        
        for (const loc of alternativeLocations) {
          await pool.execute(
            'INSERT INTO activity_alternative_locations (activity_id, location, latitude, longitude) VALUES (?, ?, ?, ?)',
            [activityId, loc.location, loc.latitude, loc.longitude]
          );
        }
      }
      
      return { id: activityId, ...activityData };
    } catch (error) {
      throw error;
    }
  },

  // Delete an activity
  deleteActivity: async (activityId) => {
    try {
      const [result] = await pool.execute(
        'DELETE FROM user_activities WHERE id = ?',
        [activityId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Get user's trajectories
  getUserTrajectories: async (userId) => {
    try {
      const [rows] = await pool.execute(
        `SELECT t.*, 
          (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', w.id, 
              'sequence_number', w.sequence_number,
              'location', w.location,
              'latitude', w.latitude, 
              'longitude', w.longitude
            )
          ) FROM trajectory_waypoints w WHERE w.trajectory_id = t.id ORDER BY w.sequence_number) AS waypoints
        FROM user_trajectories t
        WHERE t.user_id = ?
        ORDER BY t.created_at DESC`,
        [userId]
      );
      
      // Parse waypoints JSON string to object
      return rows.map(row => ({
        ...row,
        waypoints: row.waypoints ? JSON.parse(row.waypoints) : []
      }));
    } catch (error) {
      throw error;
    }
  },

  // Create a new user trajectory
  createTrajectory: async (trajectoryData) => {
    const {
      user_id,
      name,
      origin_location,
      origin_latitude,
      origin_longitude,
      destination_location,
      destination_latitude,
      destination_longitude,
      usual_departure_time,
      usual_days
    } = trajectoryData;
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO user_trajectories (
          user_id, name, origin_location, origin_latitude, origin_longitude,
          destination_location, destination_latitude, destination_longitude,
          usual_departure_time, usual_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          name,
          origin_location,
          origin_latitude,
          origin_longitude,
          destination_location,
          destination_latitude,
          destination_longitude,
          usual_departure_time || null,
          usual_days || null
        ]
      );
      
      const trajectoryId = result.insertId;
      
      // If waypoints provided, insert them
      if (trajectoryData.waypoints && trajectoryData.waypoints.length > 0) {
        const waypoints = trajectoryData.waypoints;
        
        for (let i = 0; i < waypoints.length; i++) {
          const wp = waypoints[i];
          await pool.execute(
            'INSERT INTO trajectory_waypoints (trajectory_id, sequence_number, location, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
            [trajectoryId, i+1, wp.location || null, wp.latitude, wp.longitude]
          );
        }
      }
      
      return { id: trajectoryId, ...trajectoryData };
    } catch (error) {
      throw error;
    }
  },

  // Delete a trajectory
  deleteTrajectory: async (trajectoryId) => {
    try {
      const [result] = await pool.execute(
        'DELETE FROM user_trajectories WHERE id = ?',
        [trajectoryId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  // Get all users (with pagination and filtering)
  findAll: async (options = {}) => {
    const { page = 1, limit = 10, role, searchTerm } = options;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT id, email, name, phone, role, profile_picture, created_at, updated_at 
      FROM users 
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (role) {
      query += ' AND role = ?';
      queryParams.push(role);
    }
    
    if (searchTerm) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchPattern = `%${searchTerm}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));
    
    try {
      const [rows] = await pool.execute(query, queryParams);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
      const countParams = [];
      
      if (role) {
        countQuery += ' AND role = ?';
        countParams.push(role);
      }
      
      if (searchTerm) {
        countQuery += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
        const searchPattern = `%${searchTerm}%`;
        countParams.push(searchPattern, searchPattern, searchPattern);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      return {
        users: rows,
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

module.exports = User;