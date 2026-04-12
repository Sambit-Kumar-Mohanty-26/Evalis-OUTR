import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';

const app = express();
const port = Number(process.env.PORT || 5000);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

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
