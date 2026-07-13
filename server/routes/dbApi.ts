import express, { Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../utils/auth';

const router = express.Router();

// Public tables that can be read without authentication
const PUBLIC_READ_TABLES = [
  'blog_posts',
  'events',
  'news_updates',
  'programs',
  'program_modules',
  'institutions',
  'autonomous_colleges_directory'
];

// Helper to check if a table is sensitive
const isSensitiveTable = (table: string) => {
  return ['users', 'admin_roles', 'profiles', 'user_activity_logs', 'email_change_requests'].includes(table);
};

router.post('/', async (req: any, res: Response) => {
  const { table, method, payload, filters, orderCol, orderAscending, limitCount, isSingle } = req.body;
  
  // 1. Authentication & Security Check
  let userId = null;
  
  // Try to authenticate if header is present
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const jwt = await import('jsonwebtoken');
      const decoded: any = jwt.default.verify(token, process.env.JWT_SECRET || 'academisthan-secret-key-change-this-in-production-2026');
      userId = decoded.id;
    } catch (err) {
      // Token invalid or expired
    }
  }

  // Enforce read/write permissions
  if (method === 'select') {
    if (isSensitiveTable(table) && !userId) {
      return res.status(401).json({ data: null, error: { message: 'Authentication required' } });
    }
    if (!PUBLIC_READ_TABLES.includes(table) && !userId) {
      return res.status(401).json({ data: null, error: { message: 'Authentication required' } });
    }
  } else {
    // Write operation (insert, update, delete) requires auth
    if (!userId) {
      return res.status(401).json({ data: null, error: { message: 'Authentication required for write operations' } });
    }
  }

  let sql = '';
  try {
    const params: any[] = [];

    // 2. Compile SQL statement
    if (method === 'select') {
      sql = `SELECT * FROM \`${table}\``;
    } else if (method === 'insert') {
      const keys = Object.keys(payload);
      const placeholders = keys.map(() => '?').join(', ');
      sql = `INSERT INTO \`${table}\` (\`${keys.join('`, `')}\`) VALUES (${placeholders})`;
      params.push(...keys.map(k => payload[k]));
    } else if (method === 'update') {
      const keys = Object.keys(payload);
      const assignments = keys.map(k => `\`${k}\` = ?`).join(', ');
      sql = `UPDATE \`${table}\` SET ${assignments}`;
      params.push(...keys.map(k => payload[k]));
    } else if (method === 'delete') {
      sql = `DELETE FROM \`${table}\``;
    } else {
      return res.status(400).json({ data: null, error: { message: `Unsupported method: ${method}` } });
    }

    // 3. Apply Filters
    if (filters && filters.length > 0) {
      const filterSql = filters.map((f: any) => {
        if (f.type === 'eq') {
          if (f.value === null) {
            return `\`${f.column}\` IS NULL`;
          }
          params.push(f.value);
          return `\`${f.column}\` = ?`;
        } else if (f.type === 'gte') {
          params.push(f.value);
          return `\`${f.column}\` >= ?`;
        } else if (f.type === 'lte') {
          params.push(f.value);
          return `\`${f.column}\` <= ?`;
        } else if (f.type === 'gt') {
          params.push(f.value);
          return `\`${f.column}\` > ?`;
        } else if (f.type === 'lt') {
          params.push(f.value);
          return `\`${f.column}\` < ?`;
        } else if (f.type === 'is') {
          if (f.value === null) {
            return `\`${f.column}\` IS NULL`;
          }
          params.push(f.value);
          return `\`${f.column}\` = ?`;
        } else if (f.type === 'in') {
          if (!Array.isArray(f.value) || f.value.length === 0) {
            return '1=0';
          }
          const placeholders = f.value.map(() => '?').join(', ');
          params.push(...f.value);
          return `\`${f.column}\` IN (${placeholders})`;
        } else if (f.type === 'like' || f.type === 'ilike') {
          params.push(f.value);
          return `\`${f.column}\` LIKE ?`;
        }
        return '1=1';
      }).join(' AND ');
      sql += ` WHERE ${filterSql}`;
    }

    // 4. Apply Order
    if (orderCol) {
      sql += ` ORDER BY \`${orderCol}\` ${orderAscending ? 'ASC' : 'DESC'}`;
    }

    // 5. Apply Limit
    if (limitCount) {
      sql += ` LIMIT ${limitCount}`;
    }

    // Execute query
    const [result]: any = await pool.execute(sql, params);

    let responseData = null;
    if (method === 'select') {
      responseData = isSingle ? (result[0] || null) : result;
      
      // Parse JSON fields automatically if they are returned as string in older MySQL versions
      if (Array.isArray(responseData)) {
        responseData.forEach(row => {
          if (row.metadata && typeof row.metadata === 'string') {
            try { row.metadata = JSON.parse(row.metadata); } catch(e){}
          }
          if (row.highlights && typeof row.highlights === 'string') {
            try { row.highlights = JSON.parse(row.highlights); } catch(e){}
          }
          if (row.speakers && typeof row.speakers === 'string') {
            try { row.speakers = JSON.parse(row.speakers); } catch(e){}
          }
        });
      } else if (responseData) {
        if (responseData.metadata && typeof responseData.metadata === 'string') {
          try { responseData.metadata = JSON.parse(responseData.metadata); } catch(e){}
        }
        if (responseData.highlights && typeof responseData.highlights === 'string') {
          try { responseData.highlights = JSON.parse(responseData.highlights); } catch(e){}
        }
        if (responseData.speakers && typeof responseData.speakers === 'string') {
          try { responseData.speakers = JSON.parse(responseData.speakers); } catch(e){}
        }
      }
    } else if (method === 'insert') {
      // Mimic Supabase: return the inserted object
      responseData = { ...payload };
      if (result.insertId) {
        responseData.insertId = result.insertId;
      }
    } else if (method === 'update') {
      responseData = { ...payload };
    } else {
      responseData = { success: true };
    }

    res.json({ data: responseData, error: null });
  } catch (error: any) {
    console.error('Dynamic DB Endpoint Error:', error.message, 'SQL:', sql);
    res.status(500).json({ data: null, error: { message: error.message } });
  }
});

export default router;
