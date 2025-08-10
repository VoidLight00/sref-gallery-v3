# SREF Gallery Backend API 🚀

A production-ready Node.js API server for the SREF Gallery application, featuring PostgreSQL with Prisma ORM, Redis caching, JWT authentication, and comprehensive analytics.

## 🏗️ Architecture

- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management and query caching
- **Authentication**: JWT (access + refresh tokens) with bcrypt password hashing
- **Search**: PostgreSQL full-text search with advanced filtering
- **File Storage**: AWS S3 integration ready
- **Analytics**: Comprehensive tracking and reporting system
- **Security**: Helmet, CORS, rate limiting, input validation

## 📦 Features

### Core Functionality
- ✅ User authentication and authorization (JWT)
- ✅ SREF code management (CRUD operations)
- ✅ Advanced search with filtering and faceting
- ✅ Category and tag management
- ✅ User favorites and interactions
- ✅ Analytics and tracking system
- ✅ Admin dashboard with comprehensive stats
- ✅ Premium content access control
- ✅ Real-time trending and popularity algorithms

### API Endpoints
- **Authentication**: `/api/auth/*` (register, login, refresh, password reset)
- **SREFs**: `/api/sref/*` (CRUD, search, recommendations)
- **Search**: `/api/search/*` (full-text search, suggestions, faceting)
- **Categories**: `/api/categories/*` (management, statistics)
- **Tags**: `/api/tags/*` (management, popular tags)
- **Users**: `/api/user/*` (profile, settings, activity, favorites)
- **Admin**: `/api/admin/*` (user management, content moderation)
- **Analytics**: `/api/analytics/*` (tracking, dashboard, trending)
- **Config**: `/api/config` (feature flags, system limits)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database setup**:
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed with sample data (27 real SREF codes)
   npm run db:seed
   ```

4. **Start the server**:
   ```bash
   # Development
   npm run server:dev
   
   # Production
   npm run server:start
   ```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sref_gallery
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=your-super-secure-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_SALT_ROUNDS=12
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Features
FEATURE_USER_REGISTRATION=true
FEATURE_PREMIUM_ACCOUNTS=true
FEATURE_SOCIAL_LOGIN=false
FEATURE_COLLECTIONS=false
FEATURE_WEBSOCKET=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=1000

# File Storage (AWS S3)
AWS_REGION=us-west-2
AWS_S3_BUCKET=your-sref-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@yourdomain.com

# Optional
NODE_ENV=development
PORT=3001
COMPRESSION_ENABLED=true
SWAGGER_ENABLED=true
```

## 🗄️ Database Schema

The system uses a comprehensive PostgreSQL schema with the following main entities:

- **Users**: Authentication, profiles, preferences
- **SREF Codes**: The core SREF data with metadata
- **Categories**: Organization and filtering
- **Tags**: Detailed categorization
- **Images**: Multiple images per SREF
- **Analytics**: Usage tracking and statistics
- **User Interactions**: Favorites, likes, comments

## 🔐 Authentication

### JWT Token System
- **Access Tokens**: Short-lived (1 hour), used for API requests
- **Refresh Tokens**: Long-lived (7 days), used to generate new access tokens
- **Secure Storage**: Tokens cached in Redis with automatic cleanup

### User Roles
- **Regular Users**: Basic access, limited features
- **Premium Users**: Access to premium SREFs and advanced features
- **Administrators**: Full system access and management capabilities

### Password Security
- **bcrypt Hashing**: 12 rounds for maximum security
- **Validation**: Complex password requirements enforced
- **Reset Flow**: Secure password reset via email

## 🔍 Search System

### Full-Text Search
- **PostgreSQL**: Native full-text search with ranking
- **Faceted Search**: Category, tag, and metadata filtering
- **Autocomplete**: Smart suggestions based on user input
- **Popular Queries**: Trending search terms tracking

### Search Features
- **Multi-field**: Search across title, description, tags
- **Filters**: Category, premium status, date ranges
- **Sorting**: Popularity, recency, relevance, alphabetical
- **Pagination**: Efficient cursor-based pagination

## 📊 Analytics System

### Event Tracking
- **Page Views**: User navigation tracking
- **SREF Views**: Individual SREF interaction tracking
- **Search Analytics**: Query analysis and optimization
- **User Behavior**: Comprehensive activity logging

### Admin Dashboard
- **Overview Stats**: Users, SREFs, views, activity
- **Popular Content**: Trending and most-viewed SREFs
- **User Analytics**: Registration, engagement, retention
- **Performance Metrics**: Response times, error rates

## 🛡️ Security Features

### Request Security
- **Helmet**: Security headers and XSS protection
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: IP-based request throttling
- **Input Validation**: Zod schema validation

### Data Protection
- **SQL Injection**: Prisma ORM prevents SQL injection
- **Password Hashing**: Secure bcrypt implementation
- **Token Security**: Signed JWT with secure secrets
- **Soft Deletion**: User data preserved for compliance

## 🚦 API Testing

### Health Checks
```bash
# System health
GET /api/health

# API info
GET /api/
```

### Test Users (After Seeding)
```
Admin User:
- Email: admin@sref-gallery.com
- Password: admin123!

Premium User:
- Email: premium@sref-gallery.com  
- Password: premium123!

Regular User:
- Email: user@sref-gallery.com
- Password: user123!
```

### Sample API Calls
```bash
# Register new user
POST /api/auth/register
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "Test123!",
  "firstName": "Test",
  "lastName": "User"
}

# Login
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "Test123!"
}

# Search SREFs
GET /api/search?q=anime&category=anime&limit=20

# Get popular SREFs
GET /api/analytics/popular?timeframe=7d&limit=10
```

## 📈 Performance

### Caching Strategy
- **Redis Caching**: Frequently accessed data cached for performance
- **Query Optimization**: Efficient database queries with proper indexing
- **Response Caching**: Popular API responses cached with TTL
- **Connection Pooling**: Optimized database connection management

### Scalability
- **Horizontal Scaling**: Stateless design for easy load balancing
- **Database Optimization**: Proper indexes and query optimization
- **Async Operations**: Non-blocking I/O for better throughput
- **Resource Management**: Efficient memory and connection usage

## 🧪 Development

### Scripts
```bash
# Development server with hot reload
npm run server:dev

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run database migrations  
npm run db:reset       # Reset database
npm run db:seed        # Seed with sample data
npm run db:studio      # Open Prisma Studio

# Production
npm run build          # Build for production
npm run server:start   # Start production server
```

### Code Quality
- **TypeScript**: Full type safety
- **Prisma**: Type-safe database operations
- **Zod**: Runtime type validation
- **ESLint**: Code linting and formatting
- **Error Handling**: Comprehensive error management

## 🔧 Configuration

### Feature Flags
Control system features via environment variables:
- `FEATURE_USER_REGISTRATION`: Enable/disable user registration
- `FEATURE_PREMIUM_ACCOUNTS`: Premium account functionality
- `FEATURE_SOCIAL_LOGIN`: Social authentication providers
- `FEATURE_COLLECTIONS`: User collections feature
- `FEATURE_WEBSOCKET`: Real-time features

### Performance Tuning
- **Rate Limiting**: Adjust `RATE_LIMIT_MAX_REQUESTS`
- **Caching**: Configure Redis TTL values
- **Database**: Connection pool and query timeout settings
- **File Uploads**: Size limits and processing options

## 🚀 Production Deployment

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "server:start"]
```

### Monitoring
- **Health Endpoints**: `/api/health` for load balancer checks
- **Logging**: Structured Winston logging with multiple transports
- **Metrics**: Performance and usage metrics collection
- **Error Tracking**: Comprehensive error logging and monitoring

### Security Checklist
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] JWT secrets generated securely
- [ ] CORS origins configured properly
- [ ] Rate limiting configured for production load
- [ ] SSL/TLS certificates configured
- [ ] Security headers enabled
- [ ] Input validation on all endpoints

## 📝 API Documentation

The API follows RESTful conventions with consistent response formats:

```json
{
  "success": true,
  "data": { /* response data */ },
  "pagination": { /* pagination info if applicable */ }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { /* additional error context */ }
  }
}
```

For complete API documentation, enable Swagger by setting `SWAGGER_ENABLED=true` and visit `/api/docs`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable  
5. Run linting and tests
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for the SREF Gallery community**

For questions or support, please check the documentation or create an issue.