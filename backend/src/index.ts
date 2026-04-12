import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/authRoutes';

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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Evalis Core', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`\n🚀 EVALIS CORE ACTIVE AT PORT ${port}`);
  console.log(`📡 CORS ORIGIN: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🛡️  SECURITY INTERFACE INITIALIZED\n`);
});
