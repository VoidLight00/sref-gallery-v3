import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { createPool, Pool } from 'pg';

// Environment validation
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'REDIS_URL'
];

export function validateEnvironment() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Prisma Client Configuration
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Redis Client Configuration
const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createClient> | undefined;
};

export const redis = globalForRedis.redis ?? createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || '0'),
  socket: {
    reconnectStrategy: (retries: number) => Math.min(retries * 50, 500),
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// Initialize Redis connection
if (!redis.isOpen) {
  redis.connect().catch(console.error);
}

// PostgreSQL Connection Pool (for direct queries if needed)
let pgPool: Pool | null = null;

export function getPgPool(): Pool {
  if (!pgPool) {
    pgPool = createPool({
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '60000'),
    });
  }
  return pgPool;
}

// Database connection test functions
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function testRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return false;
  }
}

// Cache helper functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key: string, value: any, expirationInSeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (expirationInSeconds) {
        await redis.setEx(key, expirationInSeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  },

  async flush(): Promise<boolean> {
    try {
      await redis.flushDb();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }
};

// Graceful shutdown
export async function closeDatabaseConnections(): Promise<void> {
  console.log('Closing database connections...');
  
  try {
    await prisma.$disconnect();
    console.log('Prisma disconnected');
  } catch (error) {
    console.error('Error disconnecting Prisma:', error);
  }

  try {
    await redis.quit();
    console.log('Redis disconnected');
  } catch (error) {
    console.error('Error disconnecting Redis:', error);
  }

  if (pgPool) {
    try {
      await pgPool.end();
      console.log('PostgreSQL pool closed');
    } catch (error) {
      console.error('Error closing PostgreSQL pool:', error);
    }
  }
}

// Handle process termination
process.on('SIGINT', closeDatabaseConnections);
process.on('SIGTERM', closeDatabaseConnections);
process.on('beforeExit', closeDatabaseConnections);