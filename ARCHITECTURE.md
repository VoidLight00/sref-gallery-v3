# SREF Gallery V3 - Production Architecture Plan

## 🚨 Crisis Assessment: Current State

**CRITICAL ISSUES IDENTIFIED:**
- **No Backend Infrastructure**: Pure frontend with static test data
- **No Database**: Hardcoded 10 SREF items, cannot scale to 500+
- **No Image Management**: Placeholder paths to non-existent WebP files
- **No User System**: No authentication or user management
- **No Real Search**: Static filtering with no search functionality
- **No Performance Optimization**: No pagination, virtual scrolling, or caching

**Current Tech Stack:**
- Next.js 15.4.6 with React 19.1.0
- TypeScript, TailwindCSS v4
- Static data in `/src/lib/data/sref-data.ts`
- Mock image paths without actual files

## 🏗️ Production-Ready Architecture

### Frontend Architecture
```
Next.js 15 App Router
├── State Management: Zustand + React Query
├── UI Components: Tailwind CSS + Headless UI
├── Image Optimization: Next.js Image + Progressive Loading
├── Performance: Virtual Scrolling + Infinite Scroll
├── PWA: Service Worker + Cache Strategies
└── TypeScript: Strict type safety
```

### Backend Architecture
```
API Layer (Next.js API Routes + External Services)
├── Database: PostgreSQL with Prisma ORM
├── Caching: Redis (Search results, Popular SREFs)
├── File Storage: AWS S3 + CloudFront CDN
├── Authentication: NextAuth.js with JWT
├── Search: PostgreSQL Full-text + Elasticsearch (optional)
└── Analytics: PostHog/Mixpanel integration
```

### Database Schema

```sql
-- Core Tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE TABLE sref_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL, -- e.g., "1747943467"
  title VARCHAR(255) NOT NULL,
  description TEXT,
  popularity_score INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  premium BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE sref_categories (
  sref_id UUID REFERENCES sref_codes(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (sref_id, category_id)
);

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0
);

CREATE TABLE sref_tags (
  sref_id UUID REFERENCES sref_codes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (sref_id, tag_id)
);

CREATE TABLE sref_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sref_id UUID REFERENCES sref_codes(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_order INTEGER DEFAULT 1, -- 1-4 for the 4 images
  alt_text VARCHAR(255),
  width INTEGER,
  height INTEGER,
  file_size INTEGER
);

CREATE TABLE user_favorites (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sref_id UUID REFERENCES sref_codes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, sref_id)
);

CREATE TABLE sref_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sref_id UUID REFERENCES sref_codes(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL, -- view, like, favorite, copy
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📡 API Endpoints

### Core SREF Operations
```typescript
GET    /api/sref?page=1&limit=20&category=anime&search=portrait&sort=popularity
POST   /api/sref (admin only) 
GET    /api/sref/:code
PUT    /api/sref/:code (admin only)
DELETE /api/sref/:code (admin only)
```

### Categories & Tags
```typescript
GET    /api/categories
GET    /api/categories/:slug/sref
GET    /api/tags?popular=true&limit=20
```

### Authentication
```typescript
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh
```

### User Interactions
```typescript
POST   /api/sref/:code/like
DELETE /api/sref/:code/like
POST   /api/sref/:code/favorite
DELETE /api/sref/:code/favorite
GET    /api/user/favorites
```

### Search & Analytics
```typescript
GET    /api/search?q=anime+portrait&filters=premium:false,category:anime
POST   /api/analytics/track
GET    /api/analytics/stats (admin only)
```

## 🚀 Performance Optimization Strategy

### Image Performance
- **Format**: Convert to WebP/AVIF with fallbacks
- **Loading**: Progressive loading with blur placeholders
- **CDN**: Global edge locations (AWS CloudFront)
- **Optimization**: Automatic compression and resizing

### Data Loading Performance
- **Virtual Scrolling**: React-window for large lists
- **Infinite Scroll**: React Query with pagination
- **Prefetching**: Next page data on scroll proximity
- **Caching**: Multi-level cache strategy

### Caching Strategy
```
Browser Cache: Static assets (1 year)
API Cache: Frequently accessed data (5-15 minutes)
Redis Cache: Search results, trending data (30 minutes)
Database: Optimized indexes and query performance
```

### Search Performance
- **PostgreSQL**: Full-text search with GIN indexes
- **Elasticsearch**: Advanced search with faceting (optional)
- **Redis**: Cache popular search queries
- **Debouncing**: Client-side search input debouncing

## 🏭 Deployment Architecture

### Production Infrastructure
```yaml
Frontend:
  Platform: Vercel (Next.js optimized)
  CDN: Global distribution
  Deployment: Automatic from main branch
  Preview: PR-based preview deployments

Backend API:
  Platform: AWS ECS Fargate / Railway (simpler option)
  Scaling: Auto-scaling based on CPU/memory
  Health: Health checks + zero-downtime deployments
  Config: Environment-based (dev/staging/prod)

Database:
  Service: AWS RDS PostgreSQL (Multi-AZ)
  Replicas: Read replicas for analytics
  Backup: Automated backups + point-in-time recovery
  Pooling: PgBouncer connection pooling

Caching:
  Service: AWS ElastiCache Redis cluster
  Structure: Separate instances for sessions vs data
  TTL: Time-based expiration policies

File Storage:
  Service: AWS S3 + CloudFront CDN
  Processing: Lambda for image optimization
  Pipeline: Automatic WebP conversion
```

### Monitoring & Security
```yaml
Application Monitoring: DataDog/New Relic
Error Tracking: Sentry
Analytics: PostHog/Mixpanel  
Uptime: Pingdom/StatusCake

Security:
  WAF: DDoS protection
  SSL: Let's Encrypt certificates
  Rate Limiting: 10 req/sec per IP
  Validation: Input sanitization
```

## 📋 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Set up PostgreSQL database with Prisma schema
- [ ] Create basic API endpoints for SREF CRUD operations
- [ ] Migrate existing test data to database
- [ ] Set up authentication system (NextAuth.js)
- [ ] Deploy basic backend to staging environment

### Phase 2: Core Features (Week 3-4)
- [ ] Implement search and filtering functionality
- [ ] Add image upload and management system
- [ ] Build user favorites and interaction features
- [ ] Set up Redis caching layer
- [ ] Create admin panel for SREF management

### Phase 3: Performance & Scale (Week 5-6)
- [ ] Implement virtual scrolling and infinite scroll
- [ ] Add image optimization pipeline
- [ ] Set up CDN and global distribution
- [ ] Performance testing with 500+ SREFs
- [ ] Analytics and monitoring setup

### Phase 4: Production (Week 7-8)
- [ ] Security audit and penetration testing
- [ ] Load testing and performance optimization
- [ ] Production deployment with monitoring
- [ ] User acceptance testing
- [ ] Launch preparation and documentation

## 🔧 Migration Strategy

### From Current Broken State to Production

1. **Keep Frontend Running**: Maintain current UI during backend development
2. **Gradual API Integration**: Replace static data calls with API calls incrementally
3. **A/B Testing**: Test new features before full rollout
4. **Backward Compatibility**: Ensure smooth transition without breaking changes
5. **Feature Flags**: Enable rollback capabilities with feature toggles

### Data Migration Plan
```sql
-- Migrate existing test data
INSERT INTO categories (name, slug, description, icon, featured) VALUES 
('Anime', 'anime', 'Japanese anime and manga style references', '🎌', true),
('Photography', 'photography', 'Professional photography style references', '📸', true);

-- Bulk insert SREF codes from current test data
-- Create migration script to populate all tables
```

## 📊 Scalability Metrics

**Current Capacity**: 10 SREF items (test data)
**Target Capacity**: 500+ SREF codes
**Performance Goals**:
- Page load time: < 2 seconds
- Search results: < 500ms
- Image loading: < 1 second (with progressive loading)
- API response time: < 100ms
- Concurrent users: 1000+

## 🎯 Success Criteria

### Technical Success
- [ ] Handle 500+ SREF codes with sub-second search
- [ ] Support 1000+ concurrent users
- [ ] 99.9% uptime SLA
- [ ] < 2 second page load times
- [ ] Mobile-first responsive design

### Business Success
- [ ] User registration and authentication
- [ ] Premium features and user tiers
- [ ] Analytics tracking and insights
- [ ] SEO optimization for organic discovery
- [ ] Social sharing and community features

---

**STATUS**: 🚨 CRITICAL - Current system cannot handle production requirements
**PRIORITY**: IMMEDIATE - Full architecture redesign required
**TIMELINE**: 8 weeks to production-ready system