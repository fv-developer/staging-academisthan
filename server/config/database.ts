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

// Test connection and apply schema auto-migration
pool.getConnection()
  .then(async connection => {
    console.log('✅ MySQL database connected successfully');
    try {
      const [columns]: any = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'lms_user_step_progress' 
          AND COLUMN_NAME = 'attempts'
      `);
      if (columns.length === 0) {
        console.log('Adding "attempts" column to "lms_user_step_progress" table...');
        await connection.query('ALTER TABLE lms_user_step_progress ADD COLUMN attempts INT DEFAULT 1 AFTER passed');
        console.log('✅ Column "attempts" added successfully');
      }
    } catch (dbErr: any) {
      console.warn('⚠️ Could not verify/alter lms_user_step_progress schema:', dbErr.message);
    }
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection error:', err.message);
  });

export { pool };
export default pool;
