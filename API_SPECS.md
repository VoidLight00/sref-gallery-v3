# SREF Gallery V3 - API Specifications

## 🔑 Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## 📝 Response Format

All API responses follow this standard format:
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

## 🎨 SREF Endpoints

### GET /api/sref
Get paginated list of SREF codes with filtering and search.

**Query Parameters:**
```typescript
interface SREFListParams {
  page?: number;          // Default: 1
  limit?: number;         // Default: 20, Max: 100
  search?: string;        // Search in title, description, tags
  category?: string;      // Category slug
  tags?: string[];        // Array of tag names
  featured?: boolean;     // Filter featured SREFs
  premium?: boolean;      // Filter premium SREFs
  sort?: 'popularity' | 'newest' | 'views' | 'likes' | 'trending';
  timeRange?: '24h' | '7d' | '30d' | 'all'; // For trending sort
}
```

**Response:**
```typescript
interface SREFListResponse {
  success: true;
  data: {
    srefs: SREFItem[];
    filters: {
      categories: Category[];
      popularTags: Tag[];
      totalCount: number;
    };
  };
  pagination: PaginationInfo;
}
```

### GET /api/sref/:code
Get detailed information for a specific SREF code.

**Parameters:**
- `code`: SREF code (e.g., "1747943467")

**Response:**
```typescript
interface SREFDetailResponse {
  success: true;
  data: {
    sref: SREFItem;
    related: SREFItem[]; // Similar SREFs
    analytics: {
      viewsToday: number;
      likesToday: number;
      trending: boolean;
    };
  };
}
```

### POST /api/sref
Create a new SREF code (Admin only).

**Request Body:**
```typescript
interface CreateSREFRequest {
  code: string;
  title: string;
  description?: string;
  images: File[]; // 1-4 image files
  categoryIds: string[];
  tags: string[];
  promptExamples?: string[];
  featured?: boolean;
  premium?: boolean;
}
```

### PUT /api/sref/:code
Update an existing SREF code (Admin only).

### DELETE /api/sref/:code
Delete a SREF code (Admin only).

## 📂 Category Endpoints

### GET /api/categories
Get all categories with SREF counts.

**Response:**
```typescript
interface CategoriesResponse {
  success: true;
  data: {
    categories: (Category & { srefCount: number })[];
    featured: Category[];
  };
}
```

### GET /api/categories/:slug/sref
Get SREFs for a specific category.

**Query Parameters:**
- Same as `/api/sref` but category is implied from URL

## 🏷️ Tag Endpoints

### GET /api/tags
Get tags with usage statistics.

**Query Parameters:**
```typescript
interface TagsParams {
  popular?: boolean;      // Get most used tags
  search?: string;        // Search tag names
  limit?: number;         // Default: 50
}
```

## 🔍 Search Endpoints

### GET /api/search
Advanced search across SREF codes.

**Query Parameters:**
```typescript
interface SearchParams {
  q: string;              // Search query
  filters?: {
    categories?: string[];
    tags?: string[];
    premium?: boolean;
    featured?: boolean;
    dateRange?: {
      from: string;
      to: string;
    };
  };
  facets?: boolean;       // Return faceted results
  page?: number;
  limit?: number;
  sort?: string;
}
```

**Response:**
```typescript
interface SearchResponse {
  success: true;
  data: {
    results: SREFItem[];
    facets?: {
      categories: Array<{ slug: string; name: string; count: number }>;
      tags: Array<{ name: string; count: number }>;
      totalByPremium: { premium: number; free: number };
    };
    searchInfo: {
      query: string;
      totalResults: number;
      executionTime: number; // in ms
    };
  };
  pagination: PaginationInfo;
}
```

### GET /api/search/suggestions
Get search suggestions for autocomplete.

**Query Parameters:**
- `q`: Partial search query

**Response:**
```typescript
interface SearchSuggestionsResponse {
  success: true;
  data: {
    suggestions: string[];
    popular: string[];
    categories: Category[];
    tags: Tag[];
  };
}
```

## 👤 Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```typescript
interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}
```

### POST /api/auth/login
Authenticate user and get JWT token.

**Request Body:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}
```

**Response:**
```typescript
interface LoginResponse {
  success: true;
  data: {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number; // seconds
  };
}
```

### POST /api/auth/logout
Logout and invalidate tokens.

### GET /api/auth/me
Get current authenticated user information.

### POST /api/auth/refresh
Refresh JWT token using refresh token.

### POST /api/auth/forgot-password
Send password reset email.

### POST /api/auth/reset-password
Reset password using token from email.

## 💝 User Interaction Endpoints

### POST /api/sref/:code/like
Like a SREF code (authenticated users only).

### DELETE /api/sref/:code/like
Remove like from a SREF code.

### POST /api/sref/:code/favorite
Add SREF to user favorites.

### DELETE /api/sref/:code/favorite
Remove SREF from user favorites.

### GET /api/user/favorites
Get user's favorite SREF codes.

**Query Parameters:**
- Standard pagination parameters

### GET /api/user/likes
Get user's liked SREF codes.

### POST /api/sref/:code/download
Track SREF download (increments counter).

**Request Body:**
```typescript
interface DownloadRequest {
  type: 'images' | 'prompts' | 'all';
}
```

## 📊 Analytics Endpoints

### POST /api/analytics/track
Track user interactions and page views.

**Request Body:**
```typescript
interface AnalyticsEvent {
  event: 'page_view' | 'sref_view' | 'search' | 'download' | 'share';
  data?: {
    page?: string;
    srefCode?: string;
    searchQuery?: string;
    referrer?: string;
    [key: string]: any;
  };
}
```

### GET /api/analytics/stats
Get analytics data (Admin only).

**Query Parameters:**
```typescript
interface AnalyticsParams {
  timeRange?: '24h' | '7d' | '30d' | '90d';
  type?: 'overview' | 'srefs' | 'users' | 'search';
}
```

## 📋 Collection Endpoints

### GET /api/collections
Get user's collections (authenticated) or public collections.

### POST /api/collections
Create a new collection.

**Request Body:**
```typescript
interface CreateCollectionRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  srefIds?: string[]; // Initial SREFs to add
}
```

### GET /api/collections/:id
Get collection details and items.

### PUT /api/collections/:id
Update collection information.

### DELETE /api/collections/:id
Delete a collection.

### POST /api/collections/:id/items
Add SREF to collection.

**Request Body:**
```typescript
interface AddToCollectionRequest {
  srefId: string;
}
```

### DELETE /api/collections/:id/items/:srefId
Remove SREF from collection.

## 🛡️ Admin Endpoints

### GET /api/admin/stats
Get comprehensive site statistics.

### GET /api/admin/users
Get user list with filtering options.

### PUT /api/admin/users/:id
Update user account (ban, promote to premium, etc.).

### GET /api/admin/reports
Get moderation reports.

### PUT /api/admin/reports/:id
Resolve moderation report.

### GET /api/admin/sref/pending
Get pending SREF submissions for approval.

### PUT /api/admin/sref/:code/approve
Approve pending SREF.

### PUT /api/admin/sref/:code/reject
Reject pending SREF.

## 🔧 System Endpoints

### GET /api/health
Health check endpoint.

**Response:**
```typescript
interface HealthResponse {
  success: true;
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    services: {
      database: 'up' | 'down';
      redis: 'up' | 'down';
      storage: 'up' | 'down';
    };
    version: string;
  };
}
```

### GET /api/config
Get public configuration (no auth required).

**Response:**
```typescript
interface ConfigResponse {
  success: true;
  data: {
    features: {
      userRegistration: boolean;
      premiumFeatures: boolean;
      socialLogin: boolean;
    };
    limits: {
      maxUploadSize: number;
      maxImagesPerSref: number;
      rateLimitPerHour: number;
    };
    version: string;
  };
}
```

## ⚡ Rate Limiting

Rate limits are applied per IP address and authenticated user:

```typescript
interface RateLimits {
  anonymous: {
    search: '100/hour';
    browse: '1000/hour';
    download: '50/hour';
  };
  authenticated: {
    search: '500/hour';
    browse: '5000/hour';
    download: '200/hour';
    like: '300/hour';
    favorite: '200/hour';
  };
  premium: {
    search: '2000/hour';
    browse: '10000/hour';
    download: '1000/hour';
    apiAccess: '5000/hour';
  };
}
```

## 🚫 Error Codes

Common error codes returned by the API:

```typescript
interface ErrorCodes {
  // Authentication
  'AUTH_REQUIRED': 'Authentication required';
  'AUTH_INVALID': 'Invalid authentication credentials';
  'AUTH_EXPIRED': 'Authentication token expired';
  'AUTH_INSUFFICIENT': 'Insufficient permissions';
  
  // Validation
  'VALIDATION_ERROR': 'Request validation failed';
  'INVALID_SREF_CODE': 'Invalid SREF code format';
  'DUPLICATE_SREF': 'SREF code already exists';
  
  // Resources
  'SREF_NOT_FOUND': 'SREF code not found';
  'USER_NOT_FOUND': 'User not found';
  'CATEGORY_NOT_FOUND': 'Category not found';
  
  // Limits
  'RATE_LIMIT_EXCEEDED': 'Rate limit exceeded';
  'UPLOAD_SIZE_EXCEEDED': 'File size too large';
  'PREMIUM_REQUIRED': 'Premium account required';
  
  // System
  'INTERNAL_ERROR': 'Internal server error';
  'SERVICE_UNAVAILABLE': 'Service temporarily unavailable';
}
```

## 🔌 WebSocket Events

Real-time updates via WebSocket connection:

```typescript
interface WebSocketEvents {
  // Client -> Server
  'join_sref': { srefCode: string };
  'leave_sref': { srefCode: string };
  'ping': {};
  
  // Server -> Client
  'sref_updated': { srefCode: string; data: Partial<SREFItem> };
  'new_like': { srefCode: string; totalLikes: number };
  'new_comment': { srefCode: string; comment: Comment };
  'trending_update': { trending: string[] };
  'pong': {};
}
```

## 📈 Performance Expectations

Target API performance metrics:

```typescript
interface PerformanceTargets {
  responseTime: {
    p50: '<100ms';   // 50th percentile
    p95: '<500ms';   // 95th percentile
    p99: '<1000ms';  // 99th percentile
  };
  throughput: {
    search: '1000 req/min';
    browse: '5000 req/min';
    auth: '500 req/min';
  };
  availability: '99.9%';
  errorRate: '<0.1%';
}
```