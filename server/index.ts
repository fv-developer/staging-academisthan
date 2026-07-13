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

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8080',
    'http://localhost:3000'
  ],
  credentials: true,
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
