import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import orgRoutes from './routes/orgRoutes';
import academicRoutes from './routes/academicRoutes';
import adminRoutes from './routes/adminRoutes';
import userRoutes from './routes/userRoutes';
import batchRoutes from './routes/batchRoutes';
import examRoutes from './routes/examRoutes';
import profileRoutes from './routes/profileRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import analyticsRoutes from './routes/analyticsRoutes';

const app = express();
const port = Number(process.env.PORT || 5000);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/org', orgRoutes);
app.use('/api/v1/academic', academicRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/batch', batchRoutes);
app.use('/api/v1/exam', examRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Evalis Core', timestamp: new Date().toISOString() });
});

app.listen(port, async () => {
  console.log(`\n🚀 EVALIS CORE ACTIVE AT PORT ${port}`);
  console.log(`📡 CORS ORIGIN: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🛡️  SECURITY INTERFACE INITIALIZED\n`);

  // Verify DB connectivity on startup so problems surface immediately
  try {
    const { db } = await import('./config/db');
    await db.$queryRaw`SELECT 1`;
    console.log('✅ Database connection verified\n');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('❌ DATABASE UNREACHABLE ON STARTUP:', msg);
    console.error('   Check DATABASE_URL and Neon project status.\n');
  }
});
