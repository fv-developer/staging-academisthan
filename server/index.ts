import { webcrypto } from 'crypto';
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true
  });
}

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import authRoutes from './routes/auth';
import profileRoutes from './routes/profiles';
import adminRoutes from './routes/admin';
import institutionRoutes from './routes/institutions';
import toolRoutes from './routes/tools';
import notificationRoutes from './routes/notifications';
import programRoutes from './routes/programs';
import connectionRoutes from './routes/connections';
import blogRoutes from './routes/blogs';
import dbApiRoutes from './routes/dbApi';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration - allows both local development and staging/production
const allowedOrigins = [
  // Local development
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:8080',
  'http://localhost:8081',
  // Staging environment
  'https://staging.academisthan.org',
  'https://api.staging.academisthan.org',
  // Production environment (when ready)
  'https://academisthan.org',
  'https://api.academisthan.org',
  // Dynamic from environment variable
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow any localhost, 127.0.0.1, or local private network IPs dynamically for local development
    const isLocalhost = 
      /^http:\/\/localhost(:\d+)?$/.test(origin) || 
      origin.startsWith('http://127.0.0.1:') || 
      origin === 'http://127.0.0.1' ||
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
      /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
      /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/.test(origin);
    
    if (isLocalhost || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked origin ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/db', dbApiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
