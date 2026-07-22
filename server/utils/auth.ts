import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header or cookie
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }
 
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
 
    const user = verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
 
    // Verify user exists in database
    const [dbUsers]: any = await pool.execute('SELECT id FROM users WHERE id = ?', [user.id]);
    if (dbUsers.length === 0) {
      return res.status(401).json({ error: 'User account no longer exists' });
    }
 
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// Generate random token for password reset
export function generateResetToken(): string {
  return Array.from({ length: 32 }, () => 
    Math.random().toString(36).charAt(2)
  ).join('');
}

// Middleware to check if user is admin
export async function isAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [roles]: any = await pool.execute(
      'SELECT role FROM admin_roles WHERE user_id = ?',
      [req.user!.id]
    );

    if (roles.length === 0) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = { ...req.user!, role: roles[0].role };
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify admin status' });
  }
}
