import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'academisthan',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection error:', err.message);
  });

export default pool;
