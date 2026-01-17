import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { AppError } from './utils/AppError';
import { testConnection, closePool } from './config/database';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.APP_PORT || 3000;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

  // Start server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
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
