import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export async function logUserActivity(
  userId: string,
  actionType: string,
  description: string,
  details: any = null
) {
  try {
    await pool.execute(
      `INSERT INTO user_activity_logs (id, user_id, action_type, description, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        userId,
        actionType,
        description,
        details ? JSON.stringify(details) : null
      ]
    );
  } catch (error) {
    console.error('Failed to log user activity:', error);
  }
}
