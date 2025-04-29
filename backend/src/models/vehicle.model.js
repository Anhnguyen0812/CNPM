const { pool } = require('../config/db.config');

// Vehicle model with database operations
const Vehicle = {
  // Create a new vehicle
  create: async (vehicleData) => {
    const { driver_id, model, year, license_plate, color, capacity, vehicle_type } = vehicleData;
    
    try {
      const [result] = await pool.execute(
        'INSERT INTO vehicles (driver_id, model, year, license_plate, color, capacity, vehicle_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [driver_id, model, year, license_plate, color, capacity, vehicle_type]
      );
      return { id: result.insertId, ...vehicleData };
    } catch (error) {
      throw error;
    }
  },

  // Find a vehicle by id
  findById: async (id) => {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM vehicles WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },
  
  // Get all vehicles for a driver
  findByDriverId: async (driverId) => {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM vehicles WHERE driver_id = ? ORDER BY is_active DESC, created_at DESC',
        [driverId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Update vehicle information
  update: async (id, vehicleData) => {
    const updateFields = [];
    const values = [];
    
    // Dynamically build update query based on provided fields
    Object.keys(vehicleData).forEach(key => {
      if (vehicleData[key] !== undefined && key !== 'id' && key !== 'driver_id') {
        updateFields.push(`${key} = ?`);
        values.push(vehicleData[key]);
      }
    });
    
    if (updateFields.length === 0) {
      return { message: 'No fields to update' };
    }
    
    try {
      const [result] = await pool.execute(
        `UPDATE vehicles SET ${updateFields.join(', ')} WHERE id = ?`,
        [...values, id]
      );
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      return { id, ...vehicleData };
    } catch (error) {
      throw error;
    }
  },
  
  // Set a vehicle as active/inactive
  setActiveStatus: async (id, isActive) => {
    try {
      const [result] = await pool.execute(
        'UPDATE vehicles SET is_active = ? WHERE id = ?',
        [isActive, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },
  
  // Delete a vehicle
  delete: async (id) => {
    try {
      const [result] = await pool.execute(
        'DELETE FROM vehicles WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },
  
  // Find available vehicles by type
  findAvailableByType: async (vehicleType) => {
    try {
      let query = `
        SELECT v.*, u.name as driver_name, u.phone as driver_phone 
        FROM vehicles v
        JOIN users u ON v.driver_id = u.id
        WHERE v.is_active = TRUE
      `;
      
      const queryParams = [];
      
      if (vehicleType) {
        query += ' AND v.vehicle_type = ?';
        queryParams.push(vehicleType);
      }
      
      const [rows] = await pool.execute(query, queryParams);
      return rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Get all vehicle types with counts
  getVehicleTypes: async () => {
    try {
      const [rows] = await pool.execute(`
        SELECT vehicle_type, COUNT(*) as count 
        FROM vehicles 
        WHERE is_active = TRUE 
        GROUP BY vehicle_type
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Vehicle;