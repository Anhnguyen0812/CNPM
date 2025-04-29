const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ride_sharing',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Please check:');
    console.error('1. MySQL server is running');
    console.error('2. Database credentials are correct');
    console.error('3. Database "ride_sharing" exists');
    console.error('4. Network configuration allows connections');
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};