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