import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { validateEnvironment, testDatabaseConnection, testRedisConnection, closeDatabaseConnections } from '../lib/database/config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRoutes } from './routes';

// Environment validation
try {
  validateEnvironment();
  logger.info('Environment validation passed');
} catch (error) {
  logger.error('Environment validation failed:', error);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy if behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression
if (process.env.COMPRESSION_ENABLED !== 'false') {
  app.use(compression());
}

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) }
  }));
} else {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000'); // 1 hour
const rateLimitMaxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000');

const limiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMaxRequests,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  }
});

app.use(limiter);

// Health check endpoint (before routes)
app.get('/api/health', async (req, res) => {
  const dbStatus = await testDatabaseConnection();
  const redisStatus = await testRedisConnection();
  
  const health = {
    status: dbStatus && redisStatus ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus ? 'up' : 'down',
      redis: redisStatus ? 'up' : 'down',
    },
    version: process.env.npm_package_version || '0.1.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json({
    success: health.status === 'healthy',
    data: health
  });
});

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'SREF Gallery API Server',
      version: process.env.npm_package_version || '0.1.0',
      timestamp: new Date().toISOString(),
      docs: process.env.SWAGGER_ENABLED === 'true' ? `${req.protocol}://${req.get('host')}/api/docs` : null
    }
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

let server: any;

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  try {
    await closeDatabaseConnections();
    logger.info('Database connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    // Test database connections
    const dbStatus = await testDatabaseConnection();
    const redisStatus = await testRedisConnection();
    
    if (!dbStatus) {
      throw new Error('Database connection failed');
    }
    
    if (!redisStatus) {
      logger.warn('Redis connection failed - caching will be disabled');
    }

    server = app.listen(PORT, () => {
      logger.info(`SREF Gallery API server started on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Database: ${dbStatus ? 'Connected' : 'Disconnected'}`);
      logger.info(`Redis: ${redisStatus ? 'Connected' : 'Disconnected'}`);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info(`Health check: http://localhost:${PORT}/api/health`);
        if (process.env.SWAGGER_ENABLED === 'true') {
          logger.info(`API docs: http://localhost:${PORT}/api/docs`);
        }
      }
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        logger.error('Server error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if this file is run directly
if (require.main === module) {
  startServer();
}

export { app, startServer };