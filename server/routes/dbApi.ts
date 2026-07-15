/**
 * Universal Database API Handler
 * Provides Supabase-like API for MySQL database
 */

import express, { Request, Response } from 'express';
import { pool } from '../config/database';

const router = express.Router();

// Helper to build WHERE clause from filters
function buildWhereClause(filters: any[]): { clause: string; values: any[] } {
  if (!filters || filters.length === 0) {
    return { clause: '', values: [] };
  }

  const conditions: string[] = [];
  const values: any[] = [];

  filters.forEach((filter) => {
    const { field, op, value } = filter;

    switch (op) {
      case 'eq':
        conditions.push(`${field} = ?`);
        values.push(value);
        break;
      case 'neq':
        conditions.push(`${field} != ?`);
        values.push(value);
        break;
      case 'gt':
        conditions.push(`${field} > ?`);
        values.push(value);
        break;
      case 'gte':
        conditions.push(`${field} >= ?`);
        values.push(value);
        break;
      case 'lt':
        conditions.push(`${field} < ?`);
        values.push(value);
        break;
      case 'lte':
        conditions.push(`${field} <= ?`);
        values.push(value);
        break;
      case 'like':
        conditions.push(`${field} LIKE ?`);
        values.push(value);
        break;
      case 'ilike':
        conditions.push(`LOWER(${field}) LIKE LOWER(?)`);
        values.push(value);
        break;
      case 'in':
        const inValues = JSON.parse(value);
        conditions.push(`${field} IN (${inValues.map(() => '?').join(', ')})`);
        values.push(...inValues);
        break;
      case 'is':
        if (value === null || value === 'null') {
          conditions.push(`${field} IS NULL`);
        } else {
          conditions.push(`${field} IS NOT NULL`);
        }
        break;
    }
  });

  return {
    clause: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
    values,
  };
}

// GET - Select/Query
router.get('/:table', async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const { select, order, ascending, limit, offset, count, head } = req.query;

    // Parse filters from query params
    const filters: any[] = [];
    Object.keys(req.query).forEach((key) => {
      if (key.startsWith('filter[')) {
        const match = key.match(/filter\[(\d+)\]\[(\w+)\]/);
        if (match) {
          const index = parseInt(match[1]);
          const prop = match[2];
          if (!filters[index]) filters[index] = {};
          filters[index][prop] = req.query[key];
        }
      }
    });

    // Build WHERE clause
    const { clause: whereClause, values: whereValues } = buildWhereClause(filters);

    // Build SELECT fields
    const selectFields = select && select !== '*' ? String(select) : '*';

    // Build ORDER BY
    let orderClause = '';
    if (order) {
      const direction = ascending === 'false' ? 'DESC' : 'ASC';
      orderClause = `ORDER BY ${order} ${direction}`;
    }

    // Build LIMIT/OFFSET
    let limitClause = '';
    if (limit) {
      limitClause = `LIMIT ${limit}`;
      if (offset) {
        limitClause += ` OFFSET ${offset}`;
      }
    }

    // If count mode, return count
    if (count === 'exact' && head === 'true') {
      const countQuery = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
      const [rows]: any = await pool.execute(countQuery, whereValues);
      return res.json({ count: rows[0].count });
    }

    // Regular query
    const query = `SELECT ${selectFields} FROM ${table} ${whereClause} ${orderClause} ${limitClause}`;
    const [rows] = await pool.execute(query, whereValues);

    // If count mode with data
    if (count === 'exact') {
      const countQuery = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
      const [countRows]: any = await pool.execute(countQuery, whereValues);
      return res.json({ data: rows, count: countRows[0].count });
    }

    res.json({ data: rows });
  } catch (error: any) {
    console.error('Database query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Insert
router.post('/:table', async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const data = Array.isArray(req.body) ? req.body : [req.body];

    if (data.length === 0) {
      return res.status(400).json({ error: 'No data provided' });
    }

    const results = [];

    for (const row of data) {
      const columns = Object.keys(row);
      const values = Object.values(row);
      const placeholders = columns.map(() => '?').join(', ');

      const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      const [result]: any = await pool.execute(query, values);

      results.push({ id: result.insertId, ...row });
    }

    res.json({ data: results });
  } catch (error: any) {
    console.error('Database insert error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT - Update
router.put('/:table', async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const updateData = req.body;

    // Parse filters
    const filters: any[] = [];
    Object.keys(req.query).forEach((key) => {
      if (key.startsWith('filter[')) {
        const match = key.match(/filter\[(\d+)\]\[(\w+)\]/);
        if (match) {
          const index = parseInt(match[1]);
          const prop = match[2];
          if (!filters[index]) filters[index] = {};
          filters[index][prop] = req.query[key];
        }
      }
    });

    const { clause: whereClause, values: whereValues } = buildWhereClause(filters);

    if (!whereClause) {
      return res.status(400).json({ error: 'Update requires WHERE clause (filters)' });
    }

    const columns = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = columns.map((col) => `${col} = ?`).join(', ');

    const query = `UPDATE ${table} SET ${setClause} ${whereClause}`;
    const [result]: any = await pool.execute(query, [...values, ...whereValues]);

    res.json({ data: { affectedRows: result.affectedRows } });
  } catch (error: any) {
    console.error('Database update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Delete
router.delete('/:table', async (req: Request, res: Response) => {
  try {
    const { table } = req.params;

    // Parse filters
    const filters: any[] = [];
    Object.keys(req.query).forEach((key) => {
      if (key.startsWith('filter[')) {
        const match = key.match(/filter\[(\d+)\]\[(\w+)\]/);
        if (match) {
          const index = parseInt(match[1]);
          const prop = match[2];
          if (!filters[index]) filters[index] = {};
          filters[index][prop] = req.query[key];
        }
      }
    });

    const { clause: whereClause, values: whereValues } = buildWhereClause(filters);

    if (!whereClause) {
      return res.status(400).json({ error: 'Delete requires WHERE clause (filters)' });
    }

    const query = `DELETE FROM ${table} ${whereClause}`;
    const [result]: any = await pool.execute(query, whereValues);

    res.json({ data: { affectedRows: result.affectedRows } });
  } catch (error: any) {
    console.error('Database delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
