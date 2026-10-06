// database/mysql.js
import dotenv from 'dotenv';
dotenv.config({path:'./config/.env'});
import mysql from 'mysql2/promise';

const mysqlDb = mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  database: process.env.DATABASE_NAME || 'node_api',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  port: process.env.DATABASE_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 10000,
});

// Test connection on startup
(async () => {
  try {
    const connection = await mysqlDb.getConnection();
    console.log('✅ MySQL connection pool created successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Error creating MySQL connection pool:', error.message);
  }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
  await mysqlDb.end();
  console.log('MySQL pool closed');
  process.exit(0);
});

export default mysqlDb;
