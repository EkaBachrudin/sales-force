import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { AppError } from './utils/AppError';
import { testConnection, closePool } from './config/database';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import leadsRoutes from './routes/leadsRoutes';
import propertiesRoutes from './routes/propertiesRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import remindersRoutes from './routes/remindersRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import { runCleanupJob } from './jobs/cleanupSessions';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.APP_PORT || 3000;
const API_VERSION = '/api/v1';

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// CORS configuration (must be before helmet)
const getAllowedOrigins = (): string | string[] => {
  const corsOrigin = process.env.CORS_ORIGIN;

  if (!corsOrigin) {
    // Production: allow only same-origin if not specified
    return process.env.NODE_ENV === 'production' ? [] : 'http://localhost:3000';
  }

  // Support multiple origins separated by comma
  return corsOrigin.split(',').map((origin) => origin.trim());
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
};
app.use(cors(corsOptions));

// Security middleware (configured to allow CORS)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API root
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Sales Force Automation System API',
    version: '1.0.0',
    docs: '/api/docs',
  });
});

// API routes
app.use(`${API_VERSION}/auth`, authRoutes);
app.use(`${API_VERSION}/admin`, adminRoutes);
app.use(`${API_VERSION}/leads`, leadsRoutes);
app.use(`${API_VERSION}/properties`, propertiesRoutes);
app.use(`${API_VERSION}/dashboard`, dashboardRoutes);
app.use(`${API_VERSION}/reminders`, remindersRoutes);
app.use(`${API_VERSION}/analytics`, analyticsRoutes);

// 404 handler
app.use((_req: Request, _res: Response, next) => {
  next(new AppError('Route not found', 404));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Test database connection before starting server
const startServer = async () => {
  const dbConnected = await testConnection();

  if (!dbConnected) {
    console.error('Failed to connect to database. Server will not start.');
    process.exit(1);
  }

  // Schedule cleanup job - runs daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[Scheduler] Running daily cleanup job...');
    await runCleanupJob();
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log('[Scheduler] Cleanup job scheduled to run daily at 2:00 AM');
  });
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await closePool();
  process.exit(0);
});

export default app;
