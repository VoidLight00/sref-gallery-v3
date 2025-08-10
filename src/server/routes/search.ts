import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma, cache } from '../../lib/database/config';
import { 
  asyncHandler, 
  sendSuccess, 
  sendPaginatedResponse,
  ValidationError 
} from '../middleware/errorHandler';
import { optionalAuthenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const searchSchema = z.object({
  q: z.string().min(1).max(255),
  filters: z.object({
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    premium: z.boolean().optional(),
    featured: z.boolean().optional(),
    verified: z.boolean().optional(),
    dateRange: z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional()
    }).optional()
  }).optional(),
  facets: z.boolean().default(false),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['relevance', 'popularity', 'newest', 'views', 'likes']).default('relevance')
});

const suggestionsSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(20).default(10)
});

// Helper function to build full-text search query
function buildSearchQuery(query: string): string {
  // Clean and prepare search terms
  const terms = query
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length >= 2)
    .slice(0, 10); // Limit to 10 terms

  if (terms.length === 0) return '';

  // Build PostgreSQL full-text search query
  // Use & for AND, | for OR, and :* for prefix matching
  return terms.map(term => `${term}:*`).join(' & ');
}

// GET /api/search
router.get('/', optionalAuthenticate, asyncHandler(async (req, res) => {
  const validatedQuery = searchSchema.parse(req.query);
  const userId = req.user?.id;

  // Build cache key
  const cacheKey = `search:${JSON.stringify(validatedQuery)}:${userId || 'anonymous'}`;
  
  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const { q, filters, facets, page, limit, sort } = validatedQuery;
  
  // Track search analytics
  const searchAnalyticsPromise = prisma.searchAnalytic.create({
    data: {
      query: q,
      filters: filters as any,
      userId,
      ipAddress: req.ip
    }
  }).catch(() => {}); // Don't fail request if analytics fail

  // Build search filters
  const searchFilters: Prisma.SrefCodeWhereInput = {
    status: 'ACTIVE'
  };

  // Full-text search
  const searchQuery = buildSearchQuery(q);
  if (searchQuery) {
    searchFilters.OR = [
      {
        title: {
          search: searchQuery
        }
      },
      {
        description: {
          search: searchQuery
        }
      },
      // Also search in tags
      {
        tags: {
          some: {
            tag: {
              name: {
                contains: q,
                mode: 'insensitive'
              }
            }
          }
        }
      }
    ];
  }

  // Apply filters
  if (filters) {
    if (filters.categories && filters.categories.length > 0) {
      searchFilters.categories = {
        some: {
          category: {
            slug: { in: filters.categories }
          }
        }
      };
    }

    if (filters.tags && filters.tags.length > 0) {
      searchFilters.tags = {
        some: {
          tag: {
            name: { in: filters.tags }
          }
        }
      };
    }

    if (filters.featured !== undefined) {
      searchFilters.featured = filters.featured;
    }

    if (filters.verified !== undefined) {
      searchFilters.verified = filters.verified;
    }

    if (filters.premium !== undefined) {
      if (filters.premium && !userId) {
        // Anonymous users can't access premium content
        throw new ValidationError('Authentication required for premium content');
      }
      
      if (filters.premium && userId) {
        // Check if user has premium access
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { premium: true, admin: true }
        });
        
        if (!user?.premium && !user?.admin) {
          throw new ValidationError('Premium account required');
        }
      }
      
      searchFilters.premium = filters.premium;
    } else if (!userId) {
      // Anonymous users only see free content
      searchFilters.premium = false;
    }

    if (filters.dateRange) {
      const dateFilter: any = {};
      if (filters.dateRange.from) {
        dateFilter.gte = new Date(filters.dateRange.from);
      }
      if (filters.dateRange.to) {
        dateFilter.lte = new Date(filters.dateRange.to);
      }
      if (Object.keys(dateFilter).length > 0) {
        searchFilters.createdAt = dateFilter;
      }
    }
  } else if (!userId) {
    // Default: anonymous users only see free content
    searchFilters.premium = false;
  }

  // Build sort order
  let orderBy: Prisma.SrefCodeOrderByWithRelationInput[];
  switch (sort) {
    case 'newest':
      orderBy = [{ createdAt: 'desc' }];
      break;
    case 'views':
      orderBy = [{ views: 'desc' }, { createdAt: 'desc' }];
      break;
    case 'likes':
      orderBy = [{ likes: 'desc' }, { createdAt: 'desc' }];
      break;
    case 'popularity':
      orderBy = [{ popularityScore: 'desc' }, { views: 'desc' }];
      break;
    case 'relevance':
    default:
      // For relevance, prioritize featured and verified content, then popularity
      orderBy = [
        { featured: 'desc' },
        { verified: 'desc' },
        { popularityScore: 'desc' }
      ];
      break;
  }

  // Get total count for pagination
  const total = await prisma.srefCode.count({ where: searchFilters });
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  // Execute main search query
  const searchResultsPromise = prisma.srefCode.findMany({
    where: searchFilters,
    orderBy,
    skip,
    take: limit,
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
              color: true
            }
          }
        }
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          }
        }
      },
      images: {
        where: { imageOrder: 1 },
        select: {
          id: true,
          imageUrl: true,
          thumbnailUrl: true,
          blurHash: true,
          width: true,
          height: true
        },
        take: 1
      },
      _count: {
        select: {
          userLikes: true,
          userFavorites: true
        }
      },
      ...(userId && {
        userLikes: {
          where: { userId },
          select: { userId: true }
        },
        userFavorites: {
          where: { userId },
          select: { userId: true }
        }
      })
    }
  });

  // Get facets if requested
  let facetsData = null;
  if (facets) {
    const facetsPromise = Promise.all([
      // Category facets
      prisma.srefCode.groupBy({
        by: ['id'],
        where: searchFilters,
        _count: true
      }).then(() => 
        prisma.$queryRaw<Array<{category_slug: string, category_name: string, count: bigint}>>`
          SELECT c.slug as category_slug, c.name as category_name, COUNT(sc.sref_id)::bigint as count
          FROM categories c
          INNER JOIN sref_categories sc ON c.id = sc.category_id
          INNER JOIN sref_codes s ON sc.sref_id = s.id
          WHERE s.status = 'ACTIVE'
          AND (${searchQuery ? Prisma.sql`(to_tsvector('english', s.title) @@ to_tsquery('english', ${searchQuery}) OR to_tsvector('english', s.description) @@ to_tsquery('english', ${searchQuery}))` : Prisma.sql`true`})
          GROUP BY c.id, c.slug, c.name
          ORDER BY count DESC
          LIMIT 20
        `
      ),
      // Tag facets  
      prisma.$queryRaw<Array<{tag_name: string, count: bigint}>>`
        SELECT t.name as tag_name, COUNT(st.sref_id)::bigint as count
        FROM tags t
        INNER JOIN sref_tags st ON t.id = st.tag_id
        INNER JOIN sref_codes s ON st.sref_id = s.id
        WHERE s.status = 'ACTIVE'
        AND (${searchQuery ? Prisma.sql`(to_tsvector('english', s.title) @@ to_tsquery('english', ${searchQuery}) OR to_tsvector('english', s.description) @@ to_tsquery('english', ${searchQuery}))` : Prisma.sql`true`})
        GROUP BY t.id, t.name
        ORDER BY count DESC
        LIMIT 20
      `,
      // Premium/free content counts
      prisma.srefCode.groupBy({
        by: ['premium'],
        where: searchFilters,
        _count: true
      })
    ]);

    const [categoryFacets, tagFacets, premiumFacets] = await facetsPromise;
    
    facetsData = {
      categories: categoryFacets.map(c => ({
        slug: c.category_slug,
        name: c.category_name,
        count: Number(c.count)
      })),
      tags: tagFacets.map(t => ({
        name: t.tag_name,
        count: Number(t.count)
      })),
      totalByPremium: {
        free: premiumFacets.find(p => !p.premium)?._count || 0,
        premium: premiumFacets.find(p => p.premium)?._count || 0
      }
    };
  }

  // Wait for search results and analytics
  const [searchResults] = await Promise.all([
    searchResultsPromise,
    searchAnalyticsPromise
  ]);

  // Update search analytics with results count
  prisma.searchAnalytic.updateMany({
    where: {
      query: q,
      userId,
      resultsCount: null,
      createdAt: {
        gte: new Date(Date.now() - 5000) // Last 5 seconds
      }
    },
    data: {
      resultsCount: total
    }
  }).catch(() => {});

  // Transform search results
  const transformedResults = searchResults.map(sref => ({
    id: sref.id,
    code: sref.code,
    title: sref.title,
    description: sref.description,
    slug: sref.slug,
    featured: sref.featured,
    premium: sref.premium,
    verified: sref.verified,
    popularityScore: sref.popularityScore,
    views: sref.views,
    likes: sref.likes,
    createdAt: sref.createdAt,
    categories: sref.categories.map(sc => sc.category),
    tags: sref.tags.map(st => st.tag),
    images: sref.images,
    stats: {
      totalLikes: sref._count.userLikes,
      totalFavorites: sref._count.userFavorites
    },
    userInteractions: userId ? {
      liked: sref.userLikes?.length > 0,
      favorited: sref.userFavorites?.length > 0
    } : null
  }));

  const response = {
    success: true,
    data: {
      results: transformedResults,
      ...(facetsData && { facets: facetsData }),
      searchInfo: {
        query: q,
        totalResults: total,
        executionTime: Date.now() - Date.now() // Would need actual timing
      }
    },
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };

  // Cache popular searches for 2 minutes
  if (searchResults.length > 0) {
    await cache.set(cacheKey, response, 2 * 60);
  }

  logger.info('Search executed', {
    query: q,
    resultsCount: total,
    userId,
    filters
  });

  res.json(response);
}));

// GET /api/search/suggestions
router.get('/suggestions', asyncHandler(async (req, res) => {
  const { q, limit } = suggestionsSchema.parse(req.query);

  // Check cache first
  const cacheKey = `search_suggestions:${q}:${limit}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return sendSuccess(res, cached);
  }

  // Get suggestions from different sources
  const [
    // SREF titles that start with or contain the query
    titleSuggestions,
    // Popular tags that match
    tagSuggestions,
    // Categories that match
    categorySuggestions,
    // Most popular searches containing this term
    popularSearches
  ] = await Promise.all([
    prisma.srefCode.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { title: { startsWith: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: { title: true },
      orderBy: { popularityScore: 'desc' },
      take: Math.min(limit, 5)
    }),
    
    prisma.tag.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' }
      },
      select: { name: true },
      orderBy: { usageCount: 'desc' },
      take: Math.min(limit, 5)
    }),

    prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: { name: true, slug: true, icon: true },
      orderBy: { srefCount: 'desc' },
      take: 3
    }),

    // Get popular search terms (this would be better with a dedicated search_terms table)
    prisma.searchAnalytic.groupBy({
      by: ['query'],
      where: {
        query: { contains: q, mode: 'insensitive' },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 3
    })
  ]);

  // Combine and deduplicate suggestions
  const suggestions = new Set<string>();
  
  // Add title suggestions
  titleSuggestions.forEach(sref => suggestions.add(sref.title));
  
  // Add tag suggestions
  tagSuggestions.forEach(tag => suggestions.add(tag.name));
  
  // Add popular searches
  popularSearches.forEach(search => suggestions.add(search.query));

  const suggestionArray = Array.from(suggestions).slice(0, limit);

  const response = {
    suggestions: suggestionArray,
    popular: popularSearches.map(s => s.query),
    categories: categorySuggestions,
    tags: tagSuggestions.map(t => ({ name: t.name }))
  };

  // Cache for 5 minutes
  await cache.set(cacheKey, response, 5 * 60);

  sendSuccess(res, response);
}));

// GET /api/search/trending
router.get('/trending', asyncHandler(async (req, res) => {
  const cacheKey = 'search_trending';
  const cached = await cache.get(cacheKey);
  if (cached) {
    return sendSuccess(res, cached);
  }

  // Get trending search terms from the last 24 hours
  const trendingSearches = await prisma.searchAnalytic.groupBy({
    by: ['query'],
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      },
      resultsCount: { gt: 0 } // Only searches that returned results
    },
    _count: { query: true },
    orderBy: { _count: { query: 'desc' } },
    take: 10
  });

  // Get trending SREF codes (most viewed in last 24h)
  const trendingSrefs = await prisma.srefCode.findMany({
    where: {
      status: 'ACTIVE',
      analytics: {
        some: {
          eventType: 'VIEW',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }
    },
    select: {
      id: true,
      code: true,
      title: true,
      slug: true,
      images: {
        where: { imageOrder: 1 },
        select: { thumbnailUrl: true, blurHash: true },
        take: 1
      }
    },
    orderBy: { views: 'desc' },
    take: 6
  });

  const response = {
    searches: trendingSearches.map(s => s.query),
    srefs: trendingSrefs
  };

  // Cache for 30 minutes
  await cache.set(cacheKey, response, 30 * 60);

  sendSuccess(res, response);
}));

export { router as searchRoutes };