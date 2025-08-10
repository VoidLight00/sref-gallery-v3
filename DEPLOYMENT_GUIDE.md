# SREF Gallery V3 - Production Deployment Guide

## 🚨 Current Crisis Status

**CRITICAL**: The current application is NOT production-ready. This guide provides the roadmap to transform it from a static prototype into a scalable production system.

## 🏗️ Infrastructure Architecture

### Production Stack Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Vercel)      │    │   (Railway)     │    │   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ├─── CDN ────────────────┼─── Redis Cache ──────┤
         │   (CloudFront)         │   (ElastiCache)      │
         └─── File Storage ───────┘                      │
             (AWS S3)                                    │
                                                        │
┌─────────────────────────────────────────────────────────────────┘
│   Monitoring & Analytics
│   ├── Application: DataDog/New Relic
│   ├── Errors: Sentry  
│   ├── Analytics: PostHog
│   └── Uptime: Pingdom
└─────────────────────────────────────────────────────────────────
```

## 🔧 Environment Setup

### 1. Development Environment

**Prerequisites:**
```bash
# Node.js 18+ and npm
node --version  # Should be 18+
npm --version

# Docker for local database
docker --version

# PostgreSQL client (optional)
psql --version
```

**Local Setup:**
```bash
# Clone and install dependencies
git clone <repository>
cd sref-gallery-v3
npm install

# Set up local database with Docker
docker run --name sref-postgres \
  -e POSTGRES_PASSWORD=local_password \
  -e POSTGRES_DB=sref_gallery \
  -p 5432:5432 \
  -d postgres:15

# Set up Redis for caching
docker run --name sref-redis \
  -p 6379:6379 \
  -d redis:7-alpine

# Create environment file
cp .env.example .env.local
```

**.env.local Configuration:**
```env
# Database
DATABASE_URL="postgresql://postgres:local_password@localhost:5432/sref_gallery"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-development-secret-key"
JWT_SECRET="your-jwt-secret-key"

# File Upload (Local Development)
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE="10485760" # 10MB

# External APIs
MIDJOURNEY_API_KEY="" # Optional
OPENAI_API_KEY="" # For AI features

# Analytics (Development)
POSTHOG_KEY=""
SENTRY_DSN=""

# Features
ENABLE_REGISTRATION="true"
ENABLE_PREMIUM="true"
ADMIN_EMAIL="admin@localhost"
```

### 2. Staging Environment

**Platform**: Railway.app (Recommended for simplicity)

**Configuration:**
```env
# Database (Railway PostgreSQL)
DATABASE_URL="postgresql://user:pass@host:port/db"

# Redis (Railway Redis)
REDIS_URL="redis://user:pass@host:port"

# Authentication
NEXTAUTH_URL="https://your-staging.railway.app"
NEXTAUTH_SECRET="staging-secret-key-32-chars-min"
JWT_SECRET="staging-jwt-secret-key"

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET="sref-gallery-staging"
CLOUDFRONT_DOMAIN="d123456789.cloudfront.net"

# Email (SendGrid)
SENDGRID_API_KEY="your-sendgrid-key"
FROM_EMAIL="noreply@srefgallery.com"

# Analytics
POSTHOG_KEY="phc_staging_key"
SENTRY_DSN="https://sentry-dsn@sentry.io/project"

# Rate Limiting
RATE_LIMIT_WINDOW="3600000" # 1 hour in ms
RATE_LIMIT_MAX="1000" # requests per window

# Features
ENABLE_REGISTRATION="true"
ENABLE_PREMIUM="true"
ADMIN_EMAIL="admin@srefgallery.com"
```

### 3. Production Environment

**Frontend**: Vercel
**Backend**: AWS ECS Fargate or Railway Pro
**Database**: AWS RDS PostgreSQL
**Cache**: AWS ElastiCache Redis
**Storage**: AWS S3 + CloudFront

## 📦 Deployment Steps

### Phase 1: Database Setup

**1. Create PostgreSQL Database**
```bash
# AWS RDS setup via CLI
aws rds create-db-instance \
  --db-instance-identifier sref-gallery-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username srefadmin \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-xxxxxx \
  --multi-az \
  --backup-retention-period 7
```

**2. Run Database Migrations**
```bash
# Install Prisma CLI
npm install -g prisma

# Set up Prisma schema
npx prisma migrate dev --name init

# Run production migrations
npx prisma migrate deploy

# Seed initial data
npx prisma db seed
```

### Phase 2: Backend API Deployment

**1. Docker Configuration (docker/Dockerfile)**
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Build the application
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**2. Railway Deployment**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Set environment variables
railway variables set DATABASE_URL="postgresql://..."
railway variables set REDIS_URL="redis://..."
# ... set all production variables

# Deploy
railway up
```

**3. AWS ECS Deployment (Alternative)**
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=sref_gallery
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Phase 3: Frontend Deployment

**1. Vercel Configuration (vercel.json)**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.srefgallery.com",
    "NEXT_PUBLIC_POSTHOG_KEY": "@posthog_key",
    "NEXT_PUBLIC_SENTRY_DSN": "@sentry_dsn"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/admin",
      "destination": "/admin/dashboard",
      "permanent": false
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.srefgallery.com/api/:path*"
    }
  ]
}
```

**2. Next.js Production Configuration**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  images: {
    domains: [
      'sref-gallery-prod.s3.amazonaws.com',
      'd123456789.cloudfront.net',
      'images.unsplash.com', // For development
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

### Phase 4: CDN & File Storage

**1. AWS S3 Bucket Setup**
```bash
# Create S3 bucket
aws s3 mb s3://sref-gallery-prod --region us-east-1

# Set bucket policy for public read access
aws s3api put-bucket-policy \
  --bucket sref-gallery-prod \
  --policy file://bucket-policy.json
```

**bucket-policy.json:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::sref-gallery-prod/*"
    }
  ]
}
```

**2. CloudFront Distribution**
```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

## 🔍 Monitoring Setup

### 1. Application Monitoring

**DataDog Integration:**
```javascript
// lib/monitoring.ts
import { datadogLogs } from '@datadog/browser-logs';

datadogLogs.init({
  clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN!,
  site: 'datadoghq.com',
  service: 'sref-gallery',
  env: process.env.NODE_ENV,
  version: process.env.npm_package_version,
});

export const logError = (error: Error, context?: any) => {
  datadogLogs.logger.error(error.message, {
    error: {
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
};
```

### 2. Error Tracking

**Sentry Configuration:**
```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  beforeSend(event) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.type === 'ChunkLoadError') {
        return null; // Don't report chunk load errors
      }
    }
    return event;
  },
});
```

### 3. Analytics Setup

**PostHog Configuration:**
```javascript
// lib/analytics.ts
import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: 'https://app.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
  });
}

export const trackEvent = (eventName: string, properties?: any) => {
  if (typeof window !== 'undefined') {
    posthog.capture(eventName, properties);
  }
};
```

## 🔒 Security Configuration

### 1. Environment Variables Security

**Use AWS Secrets Manager for production:**
```bash
# Store sensitive values in AWS Secrets Manager
aws secretsmanager create-secret \
  --name "sref-gallery/prod" \
  --description "Production secrets for SREF Gallery" \
  --secret-string '{
    "DATABASE_URL": "postgresql://...",
    "JWT_SECRET": "...",
    "AWS_SECRET_ACCESS_KEY": "..."
  }'
```

### 2. API Rate Limiting

**Implementation with redis:**
```typescript
// lib/rate-limit.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export async function rateLimit(
  identifier: string,
  limit: number = 100,
  window: number = 3600000 // 1 hour
) {
  const key = `rate-limit:${identifier}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, Math.floor(window / 1000));
  }
  
  return {
    remaining: Math.max(0, limit - current),
    reset: Date.now() + window,
    exceeded: current > limit,
  };
}
```

## 📊 Performance Optimization

### 1. Database Optimization

**Index Creation:**
```sql
-- Run these indexes for optimal performance
CREATE INDEX CONCURRENTLY idx_sref_codes_search 
ON sref_codes USING GIN(to_tsvector('english', title || ' ' || description));

CREATE INDEX CONCURRENTLY idx_sref_codes_popularity_status 
ON sref_codes(popularity_score DESC, status) WHERE status = 'active';

CREATE INDEX CONCURRENTLY idx_sref_analytics_created_at_type 
ON sref_analytics(created_at, event_type);
```

**Connection Pooling (PgBouncer):**
```ini
# pgbouncer.ini
[databases]
sref_gallery = host=your-rds-host port=5432 dbname=sref_gallery

[pgbouncer]
pool_mode = transaction
max_client_conn = 200
default_pool_size = 20
max_db_connections = 100
```

### 2. Redis Caching Strategy

```typescript
// lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export const cacheStrategies = {
  // Hot data - cache for 5 minutes
  trendingSREFs: { key: 'trending:srefs', ttl: 300 },
  
  // Warm data - cache for 15 minutes  
  popularCategories: { key: 'popular:categories', ttl: 900 },
  
  // Cold data - cache for 1 hour
  searchResults: { key: (query: string) => `search:${query}`, ttl: 3600 },
  
  // Static data - cache for 24 hours
  siteStats: { key: 'site:stats', ttl: 86400 },
};

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const cached = await redis.get(key);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));
  
  return data;
}
```

## 🚀 Go-Live Checklist

### Pre-Launch Testing
- [ ] Load testing with 1000+ concurrent users
- [ ] Database migration validation
- [ ] File upload/download functionality
- [ ] Payment processing (if applicable)
- [ ] Email delivery testing
- [ ] Mobile responsiveness verification
- [ ] Cross-browser compatibility testing
- [ ] Security penetration testing

### Launch Day
- [ ] DNS configuration and SSL certificates
- [ ] Monitor error rates and response times
- [ ] Check all third-party integrations
- [ ] Verify analytics and tracking
- [ ] Test user registration and login flows
- [ ] Monitor database performance
- [ ] Backup and disaster recovery procedures

### Post-Launch Monitoring (First 48 hours)
- [ ] Monitor application logs for errors
- [ ] Track user engagement metrics
- [ ] Monitor server resource utilization
- [ ] Check search functionality performance
- [ ] Validate image loading and CDN performance
- [ ] Monitor rate limiting effectiveness

## 📞 Support & Maintenance

### 1. Backup Strategy
```bash
# Automated PostgreSQL backups
# Run daily via cron job
pg_dump -h $DB_HOST -U $DB_USER -d sref_gallery | \
gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Upload to S3
aws s3 cp backup_*.sql.gz s3://sref-gallery-backups/
```

### 2. Update Process
```bash
# Zero-downtime deployment process
1. Deploy to staging environment
2. Run automated tests
3. Create database migration (if needed)
4. Deploy to production with blue-green strategy
5. Run health checks
6. Switch traffic to new version
```

### 3. Incident Response
- **Monitoring**: Set up alerts for >5% error rate, >2s response time
- **Escalation**: Define on-call rotation and incident response procedures
- **Communication**: Status page and user communication channels

---

**Status**: 🚨 CRITICAL IMPLEMENTATION REQUIRED
**Estimated Timeline**: 6-8 weeks for full production deployment
**Priority**: IMMEDIATE - Current system cannot handle real-world usage