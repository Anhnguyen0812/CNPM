// Test script for database connection
const { testConnection } = require('./src/config/db.config');
require('dotenv').config();

// Log current configuration values that will be used
console.log('Đang kiểm tra kết nối đến MySQL database...');
console.log('Cấu hình kết nối:');
console.log(`- DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
console.log(`- DB_USER: ${process.env.DB_USER || 'root'}`);
console.log(`- DB_NAME: ${process.env.DB_NAME || 'ride_sharing'}`);
console.log('- DB_PASSWORD: [HIDDEN]');

async function runTest() {
  try {
    const result = await testConnection();
    if (result) {
      console.log('✅ KẾT NỐI THÀNH CÔNG! Database hoạt động bình thường.');
    } else {
      console.log('❌ KẾT NỐI THẤT BẠI! Kiểm tra cấu hình kết nối và đảm bảo MySQL server đang chạy.');
    }
  } catch (error) {
    console.error('❌ LỖI KHÔNG XÁC ĐỊNH:', error);
  }
}

runTest();